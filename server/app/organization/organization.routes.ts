import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";

import { OrganizationService, OrganizationNotFound, OrganizationPersistenceError, OrganizationServiceError } from "./organization.service";
import { CreateOrganizationDtoSchema, UpdateOrganizationDtoSchema, OrganizationDtoSchema } from "./organization.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

function mapOrganizationServiceError(error: OrganizationServiceError): { statusCode: 404 | 500; message: string } {
  if (error instanceof OrganizationNotFound) {
    return { statusCode: 404, message: "Organization not found" };
  }

  if (error instanceof OrganizationPersistenceError) {
    return { statusCode: 500, message: "Database error" };
  }

  return { statusCode: 500, message: "Internal server error" };
}

export default async function organizationRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateOrganizationDtoSchema,
    output: OrganizationDtoSchema,
    handler: (input) => OrganizationService.create(input).pipe(Effect.mapError(mapOrganizationServiceError)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationDtoSchema,
    handler: (_, params) => OrganizationService.findOne(params.id).pipe(Effect.mapError(mapOrganizationServiceError)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: UpdateOrganizationDtoSchema,
    params: IdParamsSchema,
    output: OrganizationDtoSchema,
    handler: (input, params) => OrganizationService.update(params.id, input).pipe(Effect.mapError(mapOrganizationServiceError)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: UpdateOrganizationDtoSchema,
    params: IdParamsSchema,
    output: OrganizationDtoSchema,
    handler: (input, params) => OrganizationService.update(params.id, input).pipe(Effect.mapError(mapOrganizationServiceError)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationDtoSchema,
    handler: (_, params) => OrganizationService.remove(params.id).pipe(Effect.mapError(mapOrganizationServiceError)),
  });
}
