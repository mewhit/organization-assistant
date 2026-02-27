import { FastifyInstance } from "fastify";

export default async function commandRoutes(app: FastifyInstance) {
  app.post("/", async () => {
    return {};
  });
}
