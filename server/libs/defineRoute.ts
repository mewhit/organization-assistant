import { Effect, Schema, JSONSchema } from "effect";
import { ParseError } from "effect/ParseResult";
import { FastifyInstance } from "fastify";

type HttpError = {
  message: string;
  statusCode: 400 | 404 | 409 | 500;
};

type RouteConfig<P, I, O> = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  url: string;
  input?: Schema.Schema<I, any>;
  output: Schema.Schema<O, any>;
  params?: Schema.Schema<P, any>;
  handler: (input: I, params: P) => Effect.Effect<O, HttpError>;
  tags?: string[];
  description?: string;
};

export function defineRoute<P, I, O>(app: FastifyInstance, config: RouteConfig<P, I, O>) {
  const bodySchema = config.input ? JSONSchema.make(config.input, { target: "openApi3.1" }) : undefined;

  const responseSchema = JSONSchema.make(config.output, { target: "openApi3.1" });

  app.route({
    method: config.method,
    url: config.url,
    schema: {
      body: bodySchema,
      response: {
        200: responseSchema,
        201: responseSchema,
        400: JSONSchema.make(Schema.Struct({ message: Schema.String }), { target: "openApi3.1" }),
        404: JSONSchema.make(Schema.Struct({ message: Schema.String }), { target: "openApi3.1" }),
        409: JSONSchema.make(Schema.Struct({ message: Schema.String }), { target: "openApi3.1" }),
        500: JSONSchema.make(Schema.Struct({ message: Schema.String }), { target: "openApi3.1" }),
      },
      tags: config.tags,
      description: config.description,
    },
    handler: async (req, reply) => {
      const program = Effect.gen(function* () {
        const parsedInput = config.input ? yield* Schema.decodeUnknown(config.input)(req.body) : undefined;
        const params = config.params ? yield* Schema.decodeUnknown(config.params)(req.params) : undefined;

        return yield* config.handler(parsedInput as I, params as P);
      }).pipe(
        Effect.match({
          onFailure: (error) => {
            if (error instanceof ParseError) {
              reply.status(400).send({ message: error.message });
              return;
            }
            console.log("Unexpected error in route handler:", error);
            reply.status(error.statusCode).send({ message: error.message });
          },
          onSuccess: (result) => {
            reply.status(config.method === "POST" ? 201 : 200).send(result);
          },
        }),
      );

      return Effect.runPromise(program);
    },
  });
}
