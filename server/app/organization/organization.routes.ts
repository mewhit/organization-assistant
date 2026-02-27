import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";
import { mapErrorToHttp } from "@libs/dbHandler";

import { OrganizationService } from "./organization.service";
import { CreateOrganizationDtoSchema, UpdateOrganizationDtoSchema, OrganizationDtoSchema } from "./organization.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

export default async function organizationRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateOrganizationDtoSchema,
    output: OrganizationDtoSchema,
    handler: (input) => OrganizationService.create(input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationDtoSchema,
    handler: (_, params) => OrganizationService.findOne(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: UpdateOrganizationDtoSchema,
    params: IdParamsSchema,
    output: OrganizationDtoSchema,
    handler: (input, params) => OrganizationService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: UpdateOrganizationDtoSchema,
    params: IdParamsSchema,
    output: OrganizationDtoSchema,
    handler: (input, params) => OrganizationService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationDtoSchema,
    handler: (_, params) => OrganizationService.remove(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });
}
