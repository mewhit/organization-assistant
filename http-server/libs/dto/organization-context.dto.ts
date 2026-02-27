import { Schema } from "effect";

export const OrganizationContextDtoSchema = Schema.Struct({
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
  createdBy: Schema.optional(Schema.NullOr(Schema.UUID)),
});

export const UpdateOrganizationContextDtoSchema = Schema.partial(CreateOrganizationContextDtoSchema);

export type CreateOrganizationContextDto = Schema.Schema.Type<typeof CreateOrganizationContextDtoSchema>;
export type UpdateOrganizationContextDto = Schema.Schema.Type<typeof UpdateOrganizationContextDtoSchema>;
export type OrganizationContextDto = Schema.Schema.Type<typeof OrganizationContextDtoSchema>;
