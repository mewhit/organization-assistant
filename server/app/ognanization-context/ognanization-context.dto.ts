import { Schema } from "effect";

export const OgnanizationContextDtoSchema = Schema.Struct({
  id: Schema.UUID,
  context: Schema.String,
  updatedBy: Schema.NullOr(Schema.String),
  createdBy: Schema.NullOr(Schema.String),
  updatedAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
});

export const CreateOgnanizationContextDtoSchema = Schema.Struct({
  id: Schema.optional(Schema.UUID),
  context: Schema.String,
  updatedBy: Schema.optional(Schema.NullOr(Schema.String)),
  createdBy: Schema.optional(Schema.NullOr(Schema.String)),
  updatedAt: Schema.optional(Schema.DateFromString),
  createdAt: Schema.optional(Schema.DateFromString),
});

export const UpdateOgnanizationContextDtoSchema = Schema.partial(CreateOgnanizationContextDtoSchema);

export type CreateOgnanizationContextDto = Schema.Schema.Type<typeof CreateOgnanizationContextDtoSchema>;
export type UpdateOgnanizationContextDto = Schema.Schema.Type<typeof UpdateOgnanizationContextDtoSchema>;

export type OgnanizationContextDto = Schema.Schema.Type<typeof OgnanizationContextDtoSchema>;
