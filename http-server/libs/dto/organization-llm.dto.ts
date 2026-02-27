import { Schema } from "effect";

export const OrganizationLlmDtoSchema = Schema.Struct({
  id: Schema.UUID,
  organizationId: Schema.UUID,
  provider: Schema.String,
  apiKey: Schema.String,
  isActive: Schema.Boolean,
  updatedAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
});

export const OrganizationLlmListItemDtoSchema = Schema.Struct({
  id: Schema.UUID,
  organizationId: Schema.UUID,
  provider: Schema.String,
  isActive: Schema.Boolean,
  updatedAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
});

export const CreateOrganizationLlmDtoSchema = Schema.Struct({
  organizationId: Schema.UUID,
  provider: Schema.String,
  apiKey: Schema.String,
  isActive: Schema.optional(Schema.Boolean),
});

export const UpdateOrganizationLlmDtoSchema = Schema.partial(CreateOrganizationLlmDtoSchema);

export type CreateOrganizationLlmDto = Schema.Schema.Type<typeof CreateOrganizationLlmDtoSchema>;
export type UpdateOrganizationLlmDto = Schema.Schema.Type<typeof UpdateOrganizationLlmDtoSchema>;
export type OrganizationLlmDto = Schema.Schema.Type<typeof OrganizationLlmDtoSchema>;
export type OrganizationLlmListItemDto = Schema.Schema.Type<typeof OrganizationLlmListItemDtoSchema>;
