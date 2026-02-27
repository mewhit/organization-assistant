import { Schema } from "effect";

export const OrganizationDtoSchema = Schema.Struct({
  id: Schema.UUID,
  name: Schema.String,
  slug: Schema.String,
  isActive: Schema.Boolean,
  deletedAt: Schema.NullOr(Schema.DateFromString),
  updatedAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
});

export const CreateOrganizationDtoSchema = Schema.Struct({
  name: Schema.String,
  isActive: Schema.optional(Schema.Boolean),
  deletedAt: Schema.optional(Schema.NullOr(Schema.DateFromString)),
});

export const UpdateOrganizationDtoSchema = Schema.partial(CreateOrganizationDtoSchema);

export type CreateOrganizationDto = Schema.Schema.Type<typeof CreateOrganizationDtoSchema>;
export type UpdateOrganizationDto = Schema.Schema.Type<typeof UpdateOrganizationDtoSchema>;

export type OrganizationDto = Schema.Schema.Type<typeof OrganizationDtoSchema>;
