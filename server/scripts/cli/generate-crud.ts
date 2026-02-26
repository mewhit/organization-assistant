import fs from "fs/promises";
import path from "path";
import { generateRoute } from "./generate-route";
import { generateStorage } from "./generate-storage";
import { toCamelCase } from "./name-case";

function toPascalCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join("");
}

function buildRouteTemplate(name: string, serviceName: string, routeHandlerName: string) {
  return `
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ${serviceName} } from "./${name}.service";

type IdParams = {
  id: string;
};

export default async function ${routeHandlerName}(app: FastifyInstance) {
  app.get("/:id", async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
    const id = Number(request.params.id);

    if (Number.isNaN(id)) {
      return reply.status(400).send({ error: "Invalid id" });
    }

    return ${serviceName}.find(id);
  });

  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = (request.body ?? {}) as Record<string, unknown>;
    const created = await ${serviceName}.create(payload);

    return reply.status(201).send(created);
  });

  app.patch("/:id", async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
    const id = Number(request.params.id);

    if (Number.isNaN(id)) {
      return reply.status(400).send({ error: "Invalid id" });
    }

    const payload = (request.body ?? {}) as Record<string, unknown>;
    return ${serviceName}.update(id, payload);
  });

  app.put("/:id", async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
    const id = Number(request.params.id);

    if (Number.isNaN(id)) {
      return reply.status(400).send({ error: "Invalid id" });
    }

    const payload = (request.body ?? {}) as Record<string, unknown>;
    return ${serviceName}.update(id, payload);
  });

  app.delete("/:id", async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
    const id = Number(request.params.id);

    if (Number.isNaN(id)) {
      return reply.status(400).send({ error: "Invalid id" });
    }

    return ${serviceName}.remove(id);
  });
}
`.trim();
}

function buildServiceTemplate(name: string, serviceName: string, storageName: string) {
  return `
import { ${storageName} } from "./${name}.storage";

export const ${serviceName} = {
  create: (payload: Record<string, unknown>) => ${storageName}.insert(payload),

  find: (id: number) => ${storageName}.findOne(id),

  update: (id: number, payload: Record<string, unknown>) => ${storageName}.update(id, payload),

  remove: (id: number) => ${storageName}.del(id),
};
`.trim();
}

function buildDtoSchemaTemplate(className: string) {
  return `
import { Schema } from "effect";

export const Create${className}DtoSchema = Schema.Struct({});

export type Create${className}Dto = Schema.Schema.Type<typeof Create${className}DtoSchema>;
`.trim();
}

function buildStorageTemplate(storageName: string) {
  return `
export const ${storageName} = {
  insert: async (payload: Record<string, unknown>): Promise<unknown> => {
    throw new Error("Not implemented");
  },

  del: async (id: number): Promise<unknown> => {
    throw new Error("Not implemented");
  },

  update: async (id: number, payload: Record<string, unknown>): Promise<unknown> => {
    throw new Error("Not implemented");
  },

  findOne: async (id: number): Promise<unknown> => {
    throw new Error("Not implemented");
  },
};
`.trim();
}

export async function generateCrud(name: string) {
  await generateRoute(name, []);
  await generateStorage(name);

  const className = toPascalCase(name);
  const camelCaseName = toCamelCase(name);
  const serviceName = `${camelCaseName}Service`;
  const storageName = `${camelCaseName}Storage`;
  const routeHandlerName = `${camelCaseName}Routes`;
  const modulePath = path.join("src", name);
  const routeFilePath = path.join(modulePath, `${name}.routes.ts`);
  const serviceFilePath = path.join(modulePath, `${name}.service.ts`);
  const dtoSchemaFilePath = path.join(modulePath, `${name}.dto.schema.ts`);
  const storageFilePath = path.join(modulePath, `${name}.storage.ts`);

  const routeTemplate = buildRouteTemplate(name, serviceName, routeHandlerName);
  const serviceTemplate = buildServiceTemplate(name, serviceName, storageName);
  const dtoSchemaTemplate = buildDtoSchemaTemplate(className);
  const storageTemplate = buildStorageTemplate(storageName);

  await fs.writeFile(routeFilePath, routeTemplate);
  await fs.writeFile(serviceFilePath, serviceTemplate);
  await fs.writeFile(dtoSchemaFilePath, dtoSchemaTemplate);
  await fs.writeFile(storageFilePath, storageTemplate);

  console.log(`✅ Created CRUD module: ${name}`);
  console.log(`✅ Generated ${name}.routes.ts, ${name}.service.ts, ${name}.dto.schema.ts, and ${name}.storage.ts`);
}
