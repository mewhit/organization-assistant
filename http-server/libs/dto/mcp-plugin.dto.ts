import { Schema } from "effect";

export const McpPluginDtoSchema = Schema.Struct({
  id: Schema.UUID,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  configNeeded: Schema.Unknown,
  tools: Schema.Unknown,
  updatedAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
});

export const CreateMcpPluginDtoSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.NullOr(Schema.String)),
  configNeeded: Schema.Unknown,
  tools: Schema.optional(Schema.Unknown),
});

export const UpdateMcpPluginDtoSchema = Schema.partial(CreateMcpPluginDtoSchema);

export type CreateMcpPluginDto = Schema.Schema.Type<typeof CreateMcpPluginDtoSchema>;
export type UpdateMcpPluginDto = Schema.Schema.Type<typeof UpdateMcpPluginDtoSchema>;
export type McpPluginDto = Schema.Schema.Type<typeof McpPluginDtoSchema>;
