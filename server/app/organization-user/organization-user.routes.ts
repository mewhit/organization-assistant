import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";

import {
  OrganizationUserService,
  OrganizationUserNotFound,
  OrganizationUserPersistenceError,
  OrganizationUserServiceError,
} from "./organization-user.service";
import { CreateOrganizationUserDtoSchema, UpdateOrganizationUserDtoSchema, OrganizationUserDtoSchema } from "./organization-user.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

function mapOrganizationUserServiceError(error: OrganizationUserServiceError): { statusCode: 404 | 500; message: string } {
  if (error instanceof OrganizationUserNotFound) {
    return { statusCode: 404, message: "OrganizationUser not found" };
  }

  if (error instanceof OrganizationUserPersistenceError) {
    return { statusCode: 500, message: "Database error" };
  }

  return { statusCode: 500, message: "Internal server error" };
}

export default async function organizationUserRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateOrganizationUserDtoSchema,
    output: OrganizationUserDtoSchema,
    handler: (input) => OrganizationUserService.create(input).pipe(Effect.mapError(mapOrganizationUserServiceError)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationUserDtoSchema,
    handler: (_, params) => OrganizationUserService.findOne(params.id).pipe(Effect.mapError(mapOrganizationUserServiceError)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: UpdateOrganizationUserDtoSchema,
    params: IdParamsSchema,
    output: OrganizationUserDtoSchema,
    handler: (input, params) => OrganizationUserService.update(params.id, input).pipe(Effect.mapError(mapOrganizationUserServiceError)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: UpdateOrganizationUserDtoSchema,
    params: IdParamsSchema,
    output: OrganizationUserDtoSchema,
    handler: (input, params) => OrganizationUserService.update(params.id, input).pipe(Effect.mapError(mapOrganizationUserServiceError)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationUserDtoSchema,
    handler: (_, params) => OrganizationUserService.remove(params.id).pipe(Effect.mapError(mapOrganizationUserServiceError)),
  });
}
