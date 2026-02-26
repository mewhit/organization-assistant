import fastify from "fastify";

import { db } from "./db/client";
import userRoutes from "./user/user.routes";
import chatRoutes from "./chat/chat.routes";
import organizationRoutes from "./organization/organization.routes";

const app = fastify({ logger: true });

app.register(userRoutes, { prefix: "/user" });
app.register(chatRoutes, { prefix: "/chat" });
app.register(organizationRoutes, { prefix: "/organization" });

app.get("/", async (request, reply) => {
  return { hello: "world" };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT ?? 3000);

    if (!db) {
      app.log.warn("DATABASE_URL is not set. Drizzle ORM is configured but database features are disabled.");
    }

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
