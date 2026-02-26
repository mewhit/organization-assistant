import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";

import { UserService, UserNotFound, UserPersistenceError, UserServiceError } from "./user.service";
import { CreateUserDtoSchema, UpdateUserDtoSchema, UserDtoSchema } from "./user.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.NumberFromString,
});

function mapUserServiceError(error: UserServiceError): { statusCode: 404 | 500; message: string } {
  if (error instanceof UserNotFound) {
    return { statusCode: 404, message: "User not found" };
  }

  if (error instanceof UserPersistenceError) {
    return { statusCode: 500, message: "Database error" };
  }

  return { statusCode: 500, message: "Internal server error" };
}

export default async function userRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateUserDtoSchema,
    output: UserDtoSchema,
    handler: (input) => UserService.create(input).pipe(Effect.mapError(mapUserServiceError)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: UserDtoSchema,
    handler: (_, params) => UserService.findOne(params.id).pipe(Effect.mapError(mapUserServiceError)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: UpdateUserDtoSchema,
    params: IdParamsSchema,
    output: UserDtoSchema,
    handler: (input, params) => UserService.update(params.id, input).pipe(Effect.mapError(mapUserServiceError)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: UpdateUserDtoSchema,
    params: IdParamsSchema,
    output: UserDtoSchema,
    handler: (input, params) => UserService.update(params.id, input).pipe(Effect.mapError(mapUserServiceError)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: UserDtoSchema,
    handler: (_, params) => UserService.remove(params.id).pipe(Effect.mapError(mapUserServiceError)),
  });
}
