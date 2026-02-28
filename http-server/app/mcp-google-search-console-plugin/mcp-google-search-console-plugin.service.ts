import { Effect, Schema } from "effect";
import { google } from "googleapis";

import {
  type ExportTopPagesInput,
  ExportTopPagesInputSchema,
  type FetchProjectsInput,
  FetchProjectsInputSchema,
  type GetIndexCoverageInput,
  GetIndexCoverageInputSchema,
  type GetSearchAnalyticsInput,
  GetSearchAnalyticsInputSchema,
  type GscExecuteResultDto,
  type GscToolName,
  type GscToolsListDto,
  type InspectUrlInput,
  InspectUrlInputSchema,
  type ListSitemapsInput,
  ListSitemapsInputSchema,
} from "./mcp-google-search-console-plugin.dto";

type SearchConsoleApi = {
  sites: {
    list: () => Promise<{ data?: { siteEntry?: unknown[] } }>;
  };
  sitemaps: {
    list: (params: { siteUrl: string }) => Promise<{
      data?: {
        sitemap?: Array<{
          path?: string;
          isPending?: boolean;
          lastSubmitted?: string;
          lastDownloaded?: string;
          warnings?: string;
          errors?: string;
        }>;
      };
    }>;
  };
  searchanalytics: {
    query: (params: {
      siteUrl: string;
      requestBody: {
        startDate: string;
        endDate: string;
        dimensions: string[];
        rowLimit?: number;
        dimensionFilterGroups?: Array<{
          groupType: "and" | "or";
          filters: Array<{
            dimension: string;
            operator: "contains" | "equals" | "includingRegex";
            expression: string;
          }>;
        }>;
      };
    }) => Promise<{ data: unknown }>;
  };
  urlInspection: {
    index: {
      inspect: (params: {
        requestBody: {
          inspectionUrl: string;
          siteUrl: string;
          languageCode?: string;
        };
      }) => Promise<{
        data?: {
          inspectionResult?: {
            indexStatusResult?: {
              verdict?: string;
              coverageState?: string;
              indexingState?: string;
            };
          };
        };
      }>;
    };
  };
};

const defaultDimensions = ["page", "country", "device", "date"] as const;

class GscCredentialsMissingError {
  readonly _tag = "GscCredentialsMissingError";
}

class GscBadRequest {
  readonly _tag = "GscBadRequest";
  constructor(readonly message: string) {}
}

class GscExecutionError {
  readonly _tag = "GscExecutionError";
  constructor(readonly cause: unknown) {}
}

export type McpGoogleSearchConsolePluginServiceError = GscCredentialsMissingError | GscBadRequest | GscExecutionError;

function loadCredentialsFromEnv() {
  const raw = process.env.GSC_CREDENTIALS_JSON;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeCredentials(credentials: unknown): Record<string, unknown> | null {
  if (!credentials) {
    return null;
  }

  if (typeof credentials === "string") {
    try {
      return JSON.parse(credentials) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  if (typeof credentials === "object") {
    return credentials as Record<string, unknown>;
  }

  return null;
}

function createSearchConsoleApi(credentials?: unknown): SearchConsoleApi {
  const resolvedCredentials = normalizeCredentials(credentials) ?? loadCredentialsFromEnv();

  if (!resolvedCredentials) {
    throw new GscCredentialsMissingError();
  }
  const auth = new google.auth.GoogleAuth({
    credentials: resolvedCredentials,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  return google.searchconsole({
    version: "v1",
    auth,
  }) as SearchConsoleApi;
}

function parseInput<A>(schema: Schema.Schema<A, any>, input: unknown): Effect.Effect<A, GscBadRequest> {
  return Schema.decodeUnknown(schema)(input).pipe(Effect.mapError((error) => new GscBadRequest(error.message)));
}

async function executeFetchProjects(searchconsole: SearchConsoleApi, _input: FetchProjectsInput): Promise<unknown> {
  const res = await searchconsole.sites.list();
  return res.data?.siteEntry ?? [];
}

async function executeListSitemaps(searchconsole: SearchConsoleApi, input: ListSitemapsInput): Promise<unknown> {
  const response = await searchconsole.sitemaps.list({ siteUrl: input.siteUrl });
  const sitemaps = response.data?.sitemap ?? [];

  return sitemaps.map((sitemap) => ({
    path: sitemap.path,
    processingStatus: sitemap.isPending ? "PENDING" : "PROCESSED",
    lastSubmitted: sitemap.lastSubmitted,
    lastDownloaded: sitemap.lastDownloaded,
    warnings: sitemap.warnings,
    errors: sitemap.errors,
  }));
}

async function executeExportTopPages(searchconsole: SearchConsoleApi, input: ExportTopPagesInput): Promise<unknown> {
  const rowLimit = input.limit ?? 100;

  const response = await searchconsole.searchanalytics.query({
    siteUrl: input.siteUrl,
    requestBody: {
      startDate: input.startDate,
      endDate: input.endDate,
      dimensions: ["page"],
      rowLimit,
    },
  });

  type AnalyticsRow = {
    keys?: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  };

  const rows = (response.data as { rows?: AnalyticsRow[] })?.rows ?? [];

  const pages = rows.map((row) => ({
    page: row.keys?.[0] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));

  return {
    startDate: input.startDate,
    endDate: input.endDate,
    rowLimit,
    pages,
  };
}

async function executeGetSearchAnalytics(
  searchconsole: SearchConsoleApi,
  input: GetSearchAnalyticsInput,
): Promise<unknown> {
  const dimensionFilters: Array<{
    dimension: "query" | "country" | "device";
    operator: "contains" | "equals" | "includingRegex";
    expression: string;
  }> = [];

  if (input.filters?.queryContains) {
    dimensionFilters.push({
      dimension: "query",
      operator: "contains",
      expression: input.filters.queryContains,
    });
  }

  if (input.filters?.countries?.length) {
    const countriesRegex = input.filters.countries
      .map((country) => country.trim())
      .filter((country) => country.length > 0)
      .map((country) => country.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");

    if (countriesRegex) {
      dimensionFilters.push({
        dimension: "country",
        operator: "includingRegex",
        expression: `^(${countriesRegex})$`,
      });
    }
  }

  if (input.filters?.device) {
    dimensionFilters.push({
      dimension: "device",
      operator: "equals",
      expression: input.filters.device,
    });
  }

  const response = await searchconsole.searchanalytics.query({
    siteUrl: input.siteUrl,
    requestBody: {
      startDate: input.startDate,
      endDate: input.endDate,
      dimensions: [...(input.dimensions ?? defaultDimensions)],
      ...(dimensionFilters.length > 0
        ? {
            dimensionFilterGroups: [
              {
                groupType: "and" as const,
                filters: dimensionFilters,
              },
            ],
          }
        : {}),
    },
  });

  return response.data;
}

async function executeInspectUrl(searchconsole: SearchConsoleApi, input: InspectUrlInput): Promise<unknown> {
  const response = await searchconsole.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: input.url,
      siteUrl: input.siteUrl,
      ...(input.languageCode ? { languageCode: input.languageCode } : {}),
    },
  });

  const indexStatusResult = response.data?.inspectionResult?.indexStatusResult;
  const verdict = indexStatusResult?.verdict ?? "UNKNOWN";
  const coverageState = indexStatusResult?.coverageState;
  const indexingState = indexStatusResult?.indexingState;

  return {
    url: input.url,
    indexed: verdict === "PASS",
    reason: coverageState ?? indexingState ?? verdict,
    verdict,
  };
}

async function executeGetIndexCoverage(
  searchconsole: SearchConsoleApi,
  input: GetIndexCoverageInput,
): Promise<unknown> {
  const inspections = await Promise.all(
    input.urls.map(async (inspectionUrl) => {
      const response = await searchconsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl,
          siteUrl: input.siteUrl,
          ...(input.languageCode ? { languageCode: input.languageCode } : {}),
        },
      });

      const indexStatusResult = response.data?.inspectionResult?.indexStatusResult;
      const verdict = indexStatusResult?.verdict ?? "UNKNOWN";
      const coverageState = indexStatusResult?.coverageState;
      const indexingState = indexStatusResult?.indexingState;

      return {
        url: inspectionUrl,
        indexed: verdict === "PASS",
        reason: coverageState ?? indexingState ?? verdict,
        verdict,
      };
    }),
  );

  const nonIndexedPages = inspections.filter((item) => !item.indexed);

  return {
    totalChecked: inspections.length,
    nonIndexedCount: nonIndexedPages.length,
    nonIndexedPages,
  };
}

const toolMetadata: GscToolsListDto = {
  tools: [
    { name: "fetchProjects", description: "Lists all accessible Search Console properties" },
    { name: "listSitemaps", description: "Lists sitemaps for a property" },
    { name: "exportTopPages", description: "Returns top pages with clicks/impressions metrics" },
    { name: "getSearchAnalytics", description: "Runs Search Analytics query with optional filters" },
    { name: "inspectUrl", description: "Inspects a URL indexing state" },
    { name: "getIndexCoverage", description: "Inspects multiple URLs and returns non-indexed pages" },
  ],
};

export class McpGoogleSearchConsolePluginService {
  static listTools(): Effect.Effect<GscToolsListDto, never> {
    return Effect.succeed(toolMetadata);
  }

  static executeTool(
    tool: GscToolName,
    input: unknown,
    credentials?: unknown,
  ): Effect.Effect<GscExecuteResultDto, McpGoogleSearchConsolePluginServiceError> {
    return Effect.gen(function* () {
      console.log(tool, input);
      const searchconsole = yield* Effect.try({
        try: () => createSearchConsoleApi(credentials),
        catch: (error) => {
          if (error instanceof GscCredentialsMissingError) {
            return error;
          }

          return new GscExecutionError(error);
        },
      });

      let result: unknown;

      switch (tool) {
        case "fetchProjects": {
          const parsed = yield* parseInput(FetchProjectsInputSchema, input ?? {});
          result = yield* Effect.tryPromise({
            try: () => executeFetchProjects(searchconsole, parsed),
            catch: (error) => new GscExecutionError(error),
          });
          break;
        }
        case "listSitemaps": {
          const parsed = yield* parseInput(ListSitemapsInputSchema, input);
          result = yield* Effect.tryPromise({
            try: () => executeListSitemaps(searchconsole, parsed),
            catch: (error) => new GscExecutionError(error),
          });
          break;
        }
        case "exportTopPages": {
          const parsed = yield* parseInput(ExportTopPagesInputSchema, input);
          result = yield* Effect.tryPromise({
            try: () => executeExportTopPages(searchconsole, parsed),
            catch: (error) => new GscExecutionError(error),
          });
          break;
        }
        case "getSearchAnalytics": {
          const parsed = yield* parseInput(GetSearchAnalyticsInputSchema, input);
          result = yield* Effect.tryPromise({
            try: () => executeGetSearchAnalytics(searchconsole, parsed),
            catch: (error) => new GscExecutionError(error),
          });
          break;
        }
        case "inspectUrl": {
          const parsed = yield* parseInput(InspectUrlInputSchema, input);
          result = yield* Effect.tryPromise({
            try: () => executeInspectUrl(searchconsole, parsed),
            catch: (error) => new GscExecutionError(error),
          });
          break;
        }
        case "getIndexCoverage": {
          const parsed = yield* parseInput(GetIndexCoverageInputSchema, input);
          result = yield* Effect.tryPromise({
            try: () => executeGetIndexCoverage(searchconsole, parsed),
            catch: (error) => new GscExecutionError(error),
          });
          break;
        }
      }

      return {
        tool,
        result,
      };
    });
  }
}
