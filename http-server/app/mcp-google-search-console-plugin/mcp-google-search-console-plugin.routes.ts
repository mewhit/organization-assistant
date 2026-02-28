import { FastifyInstance } from "fastify";
import { Effect } from "effect";
import { defineRoute } from "@libs/defineRoute";

import {
  GscExecuteResultDtoSchema,
  GscExecuteToolDtoSchema,
  GscToolsListDtoSchema,
} from "./mcp-google-search-console-plugin.dto";
import { McpGoogleSearchConsolePluginService } from "./mcp-google-search-console-plugin.service";
import { mapErrorToHttp } from "@libs/dbHandler";

export default async function mcpGoogleSearchConsolePluginRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "GET",
    url: "/tools",
    output: GscToolsListDtoSchema,
    handler: () => McpGoogleSearchConsolePluginService.listTools(),
  });

  defineRoute(app, {
    method: "POST",
    url: "/execute",
    input: GscExecuteToolDtoSchema,
    output: GscExecuteResultDtoSchema,
    handler: (input) =>
      McpGoogleSearchConsolePluginService.executeTool(input.tool, input.input, input.credentials).pipe(
        Effect.mapError(mapErrorToHttp),
      ),
  });
}
