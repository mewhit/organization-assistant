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

const LOCAL_DEFS_PREFIX = "#/$defs/";

function inlineLocalDefs<T>(schema: T): T {
  const clone = structuredClone(schema);

  const walk = (value: unknown, inheritedDefs?: Record<string, unknown>): unknown => {
    if (Array.isArray(value)) {
      return value.map((item) => walk(item, inheritedDefs));
    }

    if (!value || typeof value !== "object") {
      return value;
    }

    const node = value as Record<string, unknown>;
    const nodeDefs =
      node.$defs && typeof node.$defs === "object" && !Array.isArray(node.$defs) ? (node.$defs as Record<string, unknown>) : inheritedDefs;

    if (typeof node.$ref === "string" && node.$ref.startsWith(LOCAL_DEFS_PREFIX) && nodeDefs) {
      const defName = node.$ref.slice(LOCAL_DEFS_PREFIX.length);
      const target = nodeDefs[defName];

      if (target && typeof target === "object") {
        const merged = {
          ...(structuredClone(target) as Record<string, unknown>),
          ...node,
        };

        delete merged.$ref;
        delete merged.$defs;

        return walk(merged, nodeDefs);
      }
    }

    const out: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(node)) {
      if (key === "$defs") {
        continue;
      }
      out[key] = walk(val, nodeDefs);
    }

    return out;
  };

  return walk(clone) as T;
}

function stripSchemaIds<T>(schema: T): T {
  const clone = structuredClone(schema);

  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map((item) => walk(item));
    }

    if (!value || typeof value !== "object") {
      return value;
    }

    const node = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(node)) {
      if (key === "$id") {
        continue;
      }
      out[key] = walk(val);
    }

    return out;
  };

  return walk(clone) as T;
}

function normalizeSchema<T>(schema: T): T {
  return stripSchemaIds(inlineLocalDefs(schema));
}

export function defineRoute<P, I, O>(app: FastifyInstance, config: RouteConfig<P, I, O>) {
  const bodySchema = config.input ? normalizeSchema(JSONSchema.make(config.input, { target: "openApi3.1" })) : undefined;

  const responseSchema = normalizeSchema(JSONSchema.make(config.output, { target: "openApi3.1" }));

  app.route({
    method: config.method,
    url: config.url,

    schema: {
      body: bodySchema,
      response: {
        200: responseSchema,
        201: responseSchema,
        400: normalizeSchema(JSONSchema.make(Schema.Struct({ message: Schema.String }), { target: "openApi3.1" })),
        404: normalizeSchema(JSONSchema.make(Schema.Struct({ message: Schema.String }), { target: "openApi3.1" })),
        409: normalizeSchema(JSONSchema.make(Schema.Struct({ message: Schema.String }), { target: "openApi3.1" })),
        500: normalizeSchema(JSONSchema.make(Schema.Struct({ message: Schema.String }), { target: "openApi3.1" })),
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
