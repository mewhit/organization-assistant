import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";
import { mapErrorToHttp } from "@libs/dbHandler";

import { UserService } from "./user.service";
import { CreateUserDtoSchema, UpdateUserDtoSchema, UserDtoSchema } from "./user.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

export default async function userRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateUserDtoSchema,
    output: UserDtoSchema,
    handler: (input) => UserService.create(input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: UserDtoSchema,
    handler: (_, params) => UserService.findOne(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: UpdateUserDtoSchema,
    params: IdParamsSchema,
    output: UserDtoSchema,
    handler: (input, params) => UserService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: UpdateUserDtoSchema,
    params: IdParamsSchema,
    output: UserDtoSchema,
    handler: (input, params) => UserService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: UserDtoSchema,
    handler: (_, params) => UserService.remove(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });
}
