import { Schema } from "effect";

export const OrganizationUserDtoSchema = Schema.Struct({
  id: Schema.UUID,
  userId: Schema.UUID,
  organizationId: Schema.UUID,
  updatedAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
});

export const CreateOrganizationUserDtoSchema = Schema.Struct({
  userId: Schema.UUID,
  organizationId: Schema.UUID,
});

export const UpdateOrganizationUserDtoSchema = Schema.partial(CreateOrganizationUserDtoSchema);

export type CreateOrganizationUserDto = Schema.Schema.Type<typeof CreateOrganizationUserDtoSchema>;
export type UpdateOrganizationUserDto = Schema.Schema.Type<typeof UpdateOrganizationUserDtoSchema>;
export type OrganizationUserDto = Schema.Schema.Type<typeof OrganizationUserDtoSchema>;
