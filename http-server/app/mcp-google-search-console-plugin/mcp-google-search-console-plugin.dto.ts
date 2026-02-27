import { Schema } from "effect";

export const AllowedDimensionsSchema = Schema.Literal("query", "page", "country", "device", "date");
export const AllowedDevicesSchema = Schema.Literal("DESKTOP", "MOBILE", "TABLET");

export const FetchProjectsInputSchema = Schema.Struct({});

export const ListSitemapsInputSchema = Schema.Struct({
  siteUrl: Schema.String,
});

export const ExportTopPagesInputSchema = Schema.Struct({
  siteUrl: Schema.String,
  startDate: Schema.String,
  endDate: Schema.String,
  limit: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.between(1, 25000))),
});

export const SearchAnalyticsFiltersSchema = Schema.Struct({
  queryContains: Schema.optional(Schema.NonEmptyString),
  countries: Schema.optional(Schema.Array(Schema.NonEmptyString)),
  device: Schema.optional(AllowedDevicesSchema),
});

export const GetSearchAnalyticsInputSchema = Schema.Struct({
  siteUrl: Schema.String,
  startDate: Schema.String,
  endDate: Schema.String,
  dimensions: Schema.optional(Schema.Array(AllowedDimensionsSchema)),
  filters: Schema.optional(SearchAnalyticsFiltersSchema),
});

export const InspectUrlInputSchema = Schema.Struct({
  siteUrl: Schema.String,
  url: Schema.String,
  languageCode: Schema.optional(Schema.String),
});

export const GetIndexCoverageInputSchema = Schema.Struct({
  siteUrl: Schema.String,
  urls: Schema.NonEmptyArray(Schema.String),
  languageCode: Schema.optional(Schema.String),
});

export const GscToolNameSchema = Schema.Literal(
  "fetchProjects",
  "listSitemaps",
  "exportTopPages",
  "getSearchAnalytics",
  "inspectUrl",
  "getIndexCoverage",
);

export const GscExecuteToolDtoSchema = Schema.Struct({
  tool: GscToolNameSchema,
  input: Schema.optional(Schema.Unknown),
  credentials: Schema.optional(Schema.Unknown),
});

export type FetchProjectsInput = Schema.Schema.Type<typeof FetchProjectsInputSchema>;
export type ListSitemapsInput = Schema.Schema.Type<typeof ListSitemapsInputSchema>;
export type ExportTopPagesInput = Schema.Schema.Type<typeof ExportTopPagesInputSchema>;
export type GetSearchAnalyticsInput = Schema.Schema.Type<typeof GetSearchAnalyticsInputSchema>;
export type InspectUrlInput = Schema.Schema.Type<typeof InspectUrlInputSchema>;
export type GetIndexCoverageInput = Schema.Schema.Type<typeof GetIndexCoverageInputSchema>;
export type GscToolName = Schema.Schema.Type<typeof GscToolNameSchema>;
export type GscExecuteToolDto = Schema.Schema.Type<typeof GscExecuteToolDtoSchema>;

export const GscExecuteResultDtoSchema = Schema.Struct({
  tool: GscToolNameSchema,
  result: Schema.Unknown,
});

export type GscExecuteResultDto = Schema.Schema.Type<typeof GscExecuteResultDtoSchema>;

export const GscToolMetadataDtoSchema = Schema.Struct({
  name: GscToolNameSchema,
  description: Schema.String,
});

export const GscToolsListDtoSchema = Schema.Struct({
  tools: Schema.Array(GscToolMetadataDtoSchema),
});

export type GscToolsListDto = Schema.Schema.Type<typeof GscToolsListDtoSchema>;
