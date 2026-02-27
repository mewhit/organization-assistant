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
