import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";
import { mapErrorToHttp } from "@libs/dbHandler";

import { OrganizationContextService } from "./organization-context.service";
import {
  CreateOrganizationContextDtoSchema,
  UpdateOrganizationContextDtoSchema,
  OrganizationContextDtoSchema,
} from "./organization-context.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

export default async function organizationContextRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateOrganizationContextDtoSchema,
    output: OrganizationContextDtoSchema,
    handler: (input) => OrganizationContextService.create(input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationContextDtoSchema,
    handler: (_, params) => OrganizationContextService.findOne(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: UpdateOrganizationContextDtoSchema,
    params: IdParamsSchema,
    output: OrganizationContextDtoSchema,
    handler: (input, params) =>
      OrganizationContextService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: UpdateOrganizationContextDtoSchema,
    params: IdParamsSchema,
    output: OrganizationContextDtoSchema,
    handler: (input, params) =>
      OrganizationContextService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationContextDtoSchema,
    handler: (_, params) => OrganizationContextService.remove(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });
}
