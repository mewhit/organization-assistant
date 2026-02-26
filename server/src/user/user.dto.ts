import { Schema, JSONSchema } from "effect";

export const UserDtoSchema = Schema.Struct({
  id: Schema.Number,
  email: Schema.String,
  firstName: Schema.NullOr(Schema.String),
  lastName: Schema.NullOr(Schema.String),
  displayName: Schema.NullOr(Schema.String),
  passwordHash: Schema.NullOr(Schema.String),
  isEmailVerified: Schema.Boolean,
  isActive: Schema.Boolean,
  lastLoginAt: Schema.NullOr(Schema.DateFromString),
  deletedAt: Schema.NullOr(Schema.DateFromString),
  updatedAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
});

export const CreateUserDtoSchema = Schema.Struct({
  id: Schema.optional(Schema.Number),
  email: Schema.String,
  firstName: Schema.optional(Schema.NullOr(Schema.String)),
  lastName: Schema.optional(Schema.NullOr(Schema.String)),
  displayName: Schema.optional(Schema.NullOr(Schema.String)),
  passwordHash: Schema.optional(Schema.NullOr(Schema.String)),
  isEmailVerified: Schema.optional(Schema.Boolean),
  isActive: Schema.optional(Schema.Boolean),
  lastLoginAt: Schema.optional(Schema.NullOr(Schema.DateFromString)),
  deletedAt: Schema.optional(Schema.NullOr(Schema.DateFromString)),
  updatedAt: Schema.optional(Schema.DateFromString),
  createdAt: Schema.optional(Schema.DateFromString),
});

export const UpdateUserDtoSchema = Schema.partial(CreateUserDtoSchema);

export type CreateUserDto = Schema.Schema.Type<typeof CreateUserDtoSchema>;
export type UpdateUserDto = Schema.Schema.Type<typeof UpdateUserDtoSchema>;

export type UserDto = Schema.Schema.Type<typeof UserDtoSchema>;
