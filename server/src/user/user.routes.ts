import { FastifyInstance } from "fastify";
import { FastifyReply, FastifyRequest } from "fastify";
import { Effect, Schema } from "effect";
import { UserService } from "./user.service";
import { CreateUserDtoSchema } from "./user.dto.schema";

export default async function usersRoutes(app: FastifyInstance) {
  app.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "name"],
          properties: {
            email: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const program = Effect.gen(function* () {
        // 1️⃣ Validation
        const input = yield* Schema.decodeUnknown(CreateUserDtoSchema)(request.body);

        // 2️⃣ Business logic
        return yield* UserService.create(input.email, input.name);
      });
      const result = await Effect.runPromiseExit(program);

      return Effect.match(result, {
        onFailure: (error) => {
          if (error._tag === "UserAlreadyExists") {
            return reply.status(409).send({ error: "User already exists" });
          }

          return reply.status(500).send({ error: "Internal Server Error" });
        },
        onSuccess: (user) => {
          return reply.status(201).send(user);
        },
      });
    },
  );
}
