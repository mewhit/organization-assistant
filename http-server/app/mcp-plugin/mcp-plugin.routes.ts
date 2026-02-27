import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";
import { mapErrorToHttp } from "@libs/dbHandler";

import { McpPluginService } from "./mcp-plugin.service";
import { CreateMcpPluginDtoSchema, UpdateMcpPluginDtoSchema, McpPluginDtoSchema } from "./mcp-plugin.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

export default async function mcpPluginRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateMcpPluginDtoSchema,
    output: McpPluginDtoSchema,
    handler: (input) => McpPluginService.create(input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: McpPluginDtoSchema,
    handler: (_, params) => McpPluginService.findOne(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: UpdateMcpPluginDtoSchema,
    params: IdParamsSchema,
    output: McpPluginDtoSchema,
    handler: (input, params) => McpPluginService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: UpdateMcpPluginDtoSchema,
    params: IdParamsSchema,
    output: McpPluginDtoSchema,
    handler: (input, params) => McpPluginService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: McpPluginDtoSchema,
    handler: (_, params) => McpPluginService.remove(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });
}