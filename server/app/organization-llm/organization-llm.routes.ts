import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";
import { mapErrorToHttp } from "@libs/dbHandler";

import { OrganizationLlmService } from "./organization-llm.service";
import { CreateOrganizationLlmDtoSchema, UpdateOrganizationLlmDtoSchema, OrganizationLlmDtoSchema } from "./organization-llm.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

export default async function organizationLlmRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateOrganizationLlmDtoSchema,
    output: OrganizationLlmDtoSchema,
    handler: (input) => OrganizationLlmService.create(input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationLlmDtoSchema,
    handler: (_, params) => OrganizationLlmService.findOne(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: UpdateOrganizationLlmDtoSchema,
    params: IdParamsSchema,
    output: OrganizationLlmDtoSchema,
    handler: (input, params) => OrganizationLlmService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: UpdateOrganizationLlmDtoSchema,
    params: IdParamsSchema,
    output: OrganizationLlmDtoSchema,
    handler: (input, params) => OrganizationLlmService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationLlmDtoSchema,
    handler: (_, params) => OrganizationLlmService.remove(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });
}