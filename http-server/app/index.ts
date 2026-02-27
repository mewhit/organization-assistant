import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import apiReference from "@scalar/fastify-api-reference";

import { db } from "../db/client";
import userRoutes from "./user/user.routes";
import organizationRoutes from "./organization/organization.routes";
import organizationUserRoutes from "./organization-user/organization-user.routes";
import organizationContextRoutes from "./organization-context/organization-context.routes";
import organizationUserOrchestratorRoutes from "./organization-user-orchestrator/organization-user-orchestrator.routes";
import organizationContextOrchestratorRoutes from "./organization-context-orchestrator/organization-context-orchestrator.routes";
import organizationLlmRoutes from "./organization-llm/organization-llm.routes";
import mcpPluginRoutes from "./mcp-plugin/mcp-plugin.routes";
import organizationMcpPluginRoutes from "./organization-mcp-plugin/organization-mcp-plugin.routes";
import commandOrchestratorRoutes from "./command-orchestrator/command-orchestrator.routes";
import openAiExecutorRoutes from "./open-ai-executor/open-ai-executor.routes";
import mcpGoogleSearchConsolePluginRoutes from "./mcp-google-search-console-plugin/mcp-google-search-console-plugin.routes";

const app = Fastify({ logger: true });

app.setValidatorCompiler(() => {
  return () => true;
});

const start = async () => {
  try {
    const port = Number(process.env.PORT ?? 3000);

    if (!db) {
      app.log.warn("DATABASE_URL is not set. Drizzle ORM is configured but database features are disabled.");
    }

    await app.register(swagger, {
      openapi: {
        openapi: "3.1.0",
        info: {
          title: "My Personnal Assistant API",
          version: "1.0.0",
        },
      },
    });

    await app.register(cors, {
      origin: true,
    });

    await app.register(apiReference, {
      routePrefix: "/docs",
    });

    app.get("/openapi.json", async (_req, reply) => {
      reply.type("application/json");
      return app.swagger();
    });

    await app.register(userRoutes, { prefix: "/user" });
    await app.register(organizationRoutes, { prefix: "/organization" });
    await app.register(organizationUserRoutes, { prefix: "/organization-user" });
    await app.register(organizationContextRoutes, { prefix: "/organization-context" });
    await app.register(organizationUserOrchestratorRoutes, { prefix: "/organization-user-orchestrator" });
    await app.register(organizationContextOrchestratorRoutes, { prefix: "/organization-context-orchestrator" });
    await app.register(organizationLlmRoutes, { prefix: "/organization-llm" });
    await app.register(mcpPluginRoutes, { prefix: "/mcp-plugin" });
    await app.register(organizationMcpPluginRoutes, { prefix: "/organization-mcp-plugin" });
    await app.register(commandOrchestratorRoutes, { prefix: "/command-orchestrator" });
    await app.register(openAiExecutorRoutes, { prefix: "/open-ai-executor" });
    await app.register(mcpGoogleSearchConsolePluginRoutes, { prefix: "/mcp-google-search-console-plugin" });

    await app.listen({ port, host: "0.0.0.0" });

    const address = app.server.address();

    if (address && typeof address === "object") {
      console.log(`Server started on port ${address.port}`);
      return;
    }

    console.log(`Server started on ${address}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
