import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";
import { UnknownDbError } from "@libs/dbHandler";

import { UserService, UserNotFound, UserAlreadyExists, UserServiceError } from "./user.service";
import { CreateUserDtoSchema, UpdateUserDtoSchema, UserDtoSchema } from "./user.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

function mapUserServiceError(error: UserServiceError): { statusCode: 404 | 409 | 500; message: string } {
  if (error instanceof UserNotFound) {
    return { statusCode: 404, message: "User not found" };
  }

  if (error instanceof UserAlreadyExists) {
    return { statusCode: 409, message: "User with this email already exists" };
  }

  if (error instanceof UnknownDbError) {
    return { statusCode: 500, message: String(error.cause) };
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
