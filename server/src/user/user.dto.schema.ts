import { Schema } from "effect";

export const CreateUserDtoSchema = Schema.Struct({
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  name: Schema.String.pipe(Schema.minLength(2)),
});

export type CreateUserDto = Schema.Schema.Type<typeof CreateUserDtoSchema>;
