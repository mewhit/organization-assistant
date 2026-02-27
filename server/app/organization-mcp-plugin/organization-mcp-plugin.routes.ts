import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";
import { mapErrorToHttp } from "@libs/dbHandler";

import { OrganizationMcpPluginService } from "./organization-mcp-plugin.service";
import { CreateOrganizationMcpPluginDtoSchema, UpdateOrganizationMcpPluginDtoSchema, OrganizationMcpPluginDtoSchema } from "./organization-mcp-plugin.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

export default async function organizationMcpPluginRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateOrganizationMcpPluginDtoSchema,
    output: OrganizationMcpPluginDtoSchema,
    handler: (input) => OrganizationMcpPluginService.create(input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationMcpPluginDtoSchema,
    handler: (_, params) => OrganizationMcpPluginService.findOne(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: UpdateOrganizationMcpPluginDtoSchema,
    params: IdParamsSchema,
    output: OrganizationMcpPluginDtoSchema,
    handler: (input, params) => OrganizationMcpPluginService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: UpdateOrganizationMcpPluginDtoSchema,
    params: IdParamsSchema,
    output: OrganizationMcpPluginDtoSchema,
    handler: (input, params) => OrganizationMcpPluginService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationMcpPluginDtoSchema,
    handler: (_, params) => OrganizationMcpPluginService.remove(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });
}