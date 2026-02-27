import fs from "fs/promises";
import path from "path";
import { toCamelCase, toPascalCase } from "./name-case";

const HTTP_METHODS = ["get", "post", "put", "delete", "patch"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];
type RouteDefinition = {
  method: HttpMethod;
  path: string;
};

type GenerateRouteFlags = {
  autoCrud?: boolean;
  useService?: boolean;
};

const CRUD_ROUTE_SIGNATURE = ["post:/", "get:/:id", "patch:/:id", "put:/:id", "delete:/:id"] as const;

function normalizeRoutePath(routePath: string) {
  const trimmedPath = routePath.trim();

  if (!trimmedPath) {
    throw new Error("Route path cannot be empty.");
  }

  return trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
}

function isHttpMethod(value: string): value is HttpMethod {
  return (HTTP_METHODS as readonly string[]).includes(value);
}

function parseRouteDefinitions(routeOptions: string[]) {
  const definitions: RouteDefinition[] = [];

  for (const rawDefinition of routeOptions) {
    const tokens = rawDefinition
      .split("|")
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);

    if (tokens.length < 2) {
      throw new Error(
        `Invalid route definition: \"${rawDefinition}\". Expected format: method|path or method|method|path.`,
      );
    }

    const rawPath = tokens.at(-1)!;
    const methods = tokens.slice(0, -1);

    for (const method of methods) {
      if (!isHttpMethod(method)) {
        throw new Error(
          `Invalid HTTP method: \"${method}\" in \"${rawDefinition}\". Supported methods: ${HTTP_METHODS.join(", ")}.`,
        );
      }

      definitions.push({ method, path: normalizeRoutePath(rawPath) });
    }
  }

  return definitions;
}

function hasCrudRouteSignature(definitions: RouteDefinition[]) {
  if (definitions.length !== CRUD_ROUTE_SIGNATURE.length) {
    return false;
  }

  const normalized = definitions.map(({ method, path }) => `${method}:${path}`).sort();
  const expected = [...CRUD_ROUTE_SIGNATURE].sort();

  return normalized.every((value, index) => value === expected[index]);
}

function buildCrudServiceRouteTemplate(name: string) {
  const className = toPascalCase(name);
  const routeHandlerName = `${toCamelCase(name)}Routes`;

  return `
import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";
import { mapErrorToHttp } from "@libs/dbHandler";

import { ${className}Service } from "./${name}.service";
import { Create${className}DtoSchema, Update${className}DtoSchema, ${className}DtoSchema } from "./${name}.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

export default async function ${routeHandlerName}(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: Create${className}DtoSchema,
    output: ${className}DtoSchema,
    handler: (input) => ${className}Service.create(input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: ${className}DtoSchema,
    handler: (_, params) => ${className}Service.findOne(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: Update${className}DtoSchema,
    params: IdParamsSchema,
    output: ${className}DtoSchema,
    handler: (input, params) => ${className}Service.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: Update${className}DtoSchema,
    params: IdParamsSchema,
    output: ${className}DtoSchema,
    handler: (input, params) => ${className}Service.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: ${className}DtoSchema,
    handler: (_, params) => ${className}Service.remove(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });
}
`.trim();
}

function getRouteParam(routePath: string) {
  const match = routePath.match(/:([a-zA-Z0-9_]+)/);
  return match?.[1] ?? null;
}

function buildServiceBackedHandler(definition: RouteDefinition, serviceName: string) {
  const { method, path } = definition;
  const paramName = getRouteParam(path);

  if (method === "get" && paramName) {
    return `  app.${method}("${path}", async (request: any) => {\n    return ${serviceName}.findOne(request.params?.${paramName});\n  });`;
  }

  if (method === "post") {
    return `  app.${method}("${path}", async (request: any) => {\n    return ${serviceName}.create(request.body ?? {});\n  });`;
  }

  if ((method === "put" || method === "patch") && paramName) {
    return `  app.${method}("${path}", async (request: any) => {\n    return ${serviceName}.update(request.params?.${paramName}, request.body ?? {});\n  });`;
  }

  if (method === "delete" && paramName) {
    return `  app.${method}("${path}", async (request: any) => {\n    return ${serviceName}.remove(request.params?.${paramName});\n  });`;
  }

  return `  app.${method}("${path}", async () => {\n    return {};\n  });`;
}

function appendRouteHandlers(
  routeFileContent: string,
  definitions: RouteDefinition[],
  options?: { useService?: boolean; serviceName?: string },
) {
  if (definitions.length === 0) {
    return routeFileContent;
  }

  let updatedRouteFileContent = routeFileContent;
  const handlersToAppend: string[] = [];

  for (const definition of definitions) {
    const { method, path } = definition;
    const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingRouteMatcher = new RegExp(`app\\.${method}\\(\\s*\"${escapedPath}\"`);

    if (options?.useService && options.serviceName) {
      const serviceHandler = buildServiceBackedHandler(definition, options.serviceName);
      const existingHandlerMatcher = new RegExp(
        `\\s*app\\.${method}\\(\\s*\"${escapedPath}\"\\s*,\\s*async\\s*\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]*?\\n\\s*\\}\\s*\\);?`,
      );

      if (existingHandlerMatcher.test(updatedRouteFileContent)) {
        updatedRouteFileContent = updatedRouteFileContent.replace(existingHandlerMatcher, `\n${serviceHandler}`);
      } else {
        handlersToAppend.push(serviceHandler);
      }

      continue;
    }

    if (existingRouteMatcher.test(updatedRouteFileContent)) {
      continue;
    }

    handlersToAppend.push(`  app.${method}(\"${path}\", async () => {\n    return {};\n  });`);
  }

  const handlers = handlersToAppend.join("\n\n");

  if (!handlers) {
    return updatedRouteFileContent;
  }

  const closeIndex = updatedRouteFileContent.lastIndexOf("}");

  if (closeIndex === -1) {
    throw new Error("Route file does not contain a valid function block.");
  }

  const beforeClose = updatedRouteFileContent.slice(0, closeIndex).trimEnd();
  const afterClose = updatedRouteFileContent.slice(closeIndex);

  return `${beforeClose}\n\n${handlers}\n${afterClose}`;
}

export async function generateRoute(name: string, routeOptions: string[] = [], flags: GenerateRouteFlags = {}) {
  if (flags.useService && !flags.autoCrud) {
    throw new Error("Invalid flags: -s can only be used when -a is provided.");
  }

  const modulePath = path.join("app", name);
  const routeFilePath = path.join(modulePath, `${name}.routes.ts`);
  const routeHandlerName = `${toCamelCase(name)}Routes`;
  const serviceName = `${toPascalCase(name)}Service`;
  const routeDefinitions = parseRouteDefinitions(routeOptions);
  const shouldUseCrudServiceTemplate = flags.autoCrud && flags.useService && hasCrudRouteSignature(routeDefinitions);

  await fs.mkdir(modulePath, { recursive: true });

  if (shouldUseCrudServiceTemplate) {
    const crudRouteTemplate = buildCrudServiceRouteTemplate(name);
    await fs.writeFile(routeFilePath, crudRouteTemplate);
  }

  const template = `
import { FastifyInstance } from "fastify"

export default async function ${routeHandlerName}(app: FastifyInstance) {
  
}
`.trim();

  let routeFileContent = template;

  if (!shouldUseCrudServiceTemplate) {
    try {
      routeFileContent = await fs.readFile(routeFilePath, "utf-8");
    } catch {
      routeFileContent = template;
    }
  }

  if (flags.useService && !shouldUseCrudServiceTemplate && !routeFileContent.includes(`"./${name}.service"`)) {
    const serviceImportLine = `import { ${serviceName} } from "./${name}.service"`;
    const routeLines = routeFileContent.split("\n");
    const lastImportIndex = [...routeLines]
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.trim().startsWith("import "))
      .at(-1)?.index;

    if (lastImportIndex === undefined) {
      routeLines.unshift(serviceImportLine);
    } else {
      routeLines.splice(lastImportIndex + 1, 0, serviceImportLine);
    }

    routeFileContent = routeLines.join("\n");
  }

  if (!shouldUseCrudServiceTemplate) {
    routeFileContent = appendRouteHandlers(routeFileContent, routeDefinitions, {
      useService: flags.useService,
      serviceName,
    });

    await fs.writeFile(routeFilePath, routeFileContent);
  }

  console.log(`✅ Created module: ${name}`);

  const indexPath = path.join("app", "index.ts");
  const indexContent = await fs.readFile(indexPath, "utf-8");

  const importPath = `"./${name}/${name}.routes"`;
  const importLine = `import ${routeHandlerName} from "./${name}/${name}.routes"`;
  const registerLine = `    await app.register(${routeHandlerName}, { prefix: "/${name}" });`;

  const indexLines = indexContent.split("\n");
  const existingImportIndex = indexLines.findIndex((line) => line.includes(importPath));

  if (existingImportIndex !== -1) {
    indexLines[existingImportIndex] = importLine;
  } else {
    const lastImportIndex = [...indexLines]
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.trim().startsWith("import "))
      .at(-1)?.index;

    if (lastImportIndex === undefined) {
      indexLines.unshift(importLine);
    } else {
      indexLines.splice(lastImportIndex + 1, 0, importLine);
    }
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefixMatcher = new RegExp(`^(?:await\\s+)?app\\.register\\(.+[\"']/${escapedName}[\"']\\s*\\}\\s*\\);?$`);
  const filteredIndexLines = indexLines.filter((line) => !prefixMatcher.test(line.trim()));

  const lastRegisterIndex = [...filteredIndexLines]
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^(?:await\s+)?app\.register\(/.test(line.trim()))
    .at(-1)?.index;

  if (lastRegisterIndex !== undefined) {
    filteredIndexLines.splice(lastRegisterIndex + 1, 0, registerLine);
  } else {
    const listenIndex = filteredIndexLines.findIndex((line) => /^(?:await\s+)?app\.listen\(/.test(line.trim()));

    if (listenIndex !== -1) {
      filteredIndexLines.splice(listenIndex, 0, registerLine);
    } else {
      const startFunctionIndex = filteredIndexLines.findIndex((line) => line.trim().startsWith("const start = async"));

      if (startFunctionIndex === -1) {
        filteredIndexLines.push("", registerLine.trim());
      } else {
        filteredIndexLines.splice(startFunctionIndex + 1, 0, registerLine);
      }
    }
  }

  const updatedContent = filteredIndexLines.join("\n");

  await fs.writeFile(indexPath, updatedContent);

  console.log("✅ Route registered in index.ts");

  if (routeDefinitions.length > 0) {
    console.log(`✅ Appended ${routeDefinitions.length} route handler(s) in ${name}.routes.ts`);
  }
}
