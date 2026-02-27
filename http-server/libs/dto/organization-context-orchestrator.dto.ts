import { Schema } from "effect";

export const OrganizationContextOrchestratorDtoSchema = Schema.Struct({
  id: Schema.UUID,
  context: Schema.String,
  organizationId: Schema.UUID,
  updatedBy: Schema.NullOr(Schema.UUID),
  updatedAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
});

export const CreateOrganizationContextDtoSchema = Schema.Struct({
  context: Schema.String,
  organizationId: Schema.UUID,
  updatedBy: Schema.optional(Schema.NullOr(Schema.UUID)),
});

export type CreateOrganizationContextDto = Schema.Schema.Type<typeof CreateOrganizationContextDtoSchema>;
export type OrganizationContextOrchestratorDto = Schema.Schema.Type<typeof OrganizationContextOrchestratorDtoSchema>;
