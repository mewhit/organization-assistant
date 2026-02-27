import { Schema } from "effect";

export const OrganizationMcpPluginDtoSchema = Schema.Struct({
  id: Schema.UUID,
  mcpPluginId: Schema.UUID,
  organizationId: Schema.UUID,
  config: Schema.Unknown,
  isActive: Schema.Boolean,
  updatedAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
});

export const CreateOrganizationMcpPluginDtoSchema = Schema.Struct({
  mcpPluginId: Schema.UUID,
  organizationId: Schema.UUID,
  config: Schema.Unknown,
  isActive: Schema.optional(Schema.Boolean),
});

export const UpdateOrganizationMcpPluginDtoSchema = Schema.partial(CreateOrganizationMcpPluginDtoSchema);

export type CreateOrganizationMcpPluginDto = Schema.Schema.Type<typeof CreateOrganizationMcpPluginDtoSchema>;
export type UpdateOrganizationMcpPluginDto = Schema.Schema.Type<typeof UpdateOrganizationMcpPluginDtoSchema>;
export type OrganizationMcpPluginDto = Schema.Schema.Type<typeof OrganizationMcpPluginDtoSchema>;
