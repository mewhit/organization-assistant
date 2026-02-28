import { FastifyInstance } from "fastify";
import { Effect } from "effect";
import { defineRoute } from "@libs/defineRoute";

import {
  GscExecuteResultDtoSchema,
  GscExecuteToolDtoSchema,
  GscToolsListDtoSchema,
} from "./mcp-google-search-console-plugin.dto";
import { McpGoogleSearchConsolePluginService } from "./mcp-google-search-console-plugin.service";
import { mapErrorToHttp } from "@libs/dbHandler";

type RouteHttpError = {
  statusCode: 400 | 403 | 404 | 409 | 500;
  message: string;
};

function toRouteStatusCode(statusCode: number | null): RouteHttpError["statusCode"] {
  if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409 || statusCode === 500) {
    return statusCode;
  }

  return 500;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractErrorMessage(error: unknown, depth = 0): string | null {
  if (depth > 4) {
    return null;
  }

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (!isRecord(error)) {
    return null;
  }

  const directMessage = error.message;
  if (typeof directMessage === "string" && directMessage.length > 0) {
    return directMessage;
  }

  if ("cause" in error) {
    return extractErrorMessage(error.cause, depth + 1);
  }

  return null;
}

function extractErrorStatusCode(error: unknown, depth = 0): number | null {
  if (depth > 4 || !isRecord(error)) {
    return null;
  }

  const status = error.status;
  if (typeof status === "number") {
    return status;
  }

  const code = error.code;
  if (typeof code === "number") {
    return code;
  }

  if ("cause" in error) {
    return extractErrorStatusCode(error.cause, depth + 1);
  }

  return null;
}

function mapGscErrorToHttp(error: unknown): RouteHttpError {
  if (isRecord(error) && typeof error._tag === "string") {
    if (error._tag === "GscBadRequest") {
      return {
        statusCode: 400,
        message: extractErrorMessage(error) ?? "Invalid Google Search Console request",
      };
    }

    if (error._tag === "GscCredentialsMissingError") {
      return {
        statusCode: 400,
        message: "Google Search Console credentials are missing",
      };
    }

    if (error._tag === "GscExecutionError") {
      const cause = "cause" in error ? error.cause : error;
      const statusCode = extractErrorStatusCode(cause);
      const message = extractErrorMessage(cause) ?? "Google Search Console execution failed";

      return {
        statusCode: toRouteStatusCode(statusCode),
        message: statusCode ? `GSC ${statusCode}: ${message}` : message,
      };
    }
  }

  return mapErrorToHttp(error);
}

export default async function mcpGoogleSearchConsolePluginRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "GET",
    url: "/tools",
    output: GscToolsListDtoSchema,
    handler: () => McpGoogleSearchConsolePluginService.listTools(),
  });

  defineRoute(app, {
    method: "POST",
    url: "/execute",
    input: GscExecuteToolDtoSchema,
    output: GscExecuteResultDtoSchema,
    handler: (input) =>
      McpGoogleSearchConsolePluginService.executeTool(input.tool, input.input, input.credentials).pipe(
        Effect.mapError(mapGscErrorToHttp),
      ),
  });
}
