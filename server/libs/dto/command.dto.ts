import { Schema } from "effect";

export const CommandDtoSchema = Schema.Struct({
  organizationLlm: Schema.String,
  command: Schema.String,
});

export type CommandDto = Schema.Schema.Type<typeof CommandDtoSchema>;
