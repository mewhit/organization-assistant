import Fastify from "fastify";
import swagger from "@fastify/swagger";
import apiReference from "@scalar/fastify-api-reference";

import { db } from "./db/client";
import userRoutes from "./user/user.routes";

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
          title: "My API",
          version: "1.0.0",
        },
      },
    });

    await app.register(apiReference, {
      routePrefix: "/docs",
    });

    await app.register(userRoutes, { prefix: "/user" });

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
