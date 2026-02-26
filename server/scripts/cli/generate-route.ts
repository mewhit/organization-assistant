import fs from "fs/promises";
import path from "path";
import { toCamelCase } from "./name-case";

const HTTP_METHODS = ["get", "post", "put", "delete", "patch"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];
type RouteDefinition = {
  method: HttpMethod;
  path: string;
};

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
      throw new Error(`Invalid route definition: \"${rawDefinition}\". Expected format: method|path or method|method|path.`);
    }

    const rawPath = tokens.at(-1)!;
    const methods = tokens.slice(0, -1);

    for (const method of methods) {
      if (!isHttpMethod(method)) {
        throw new Error(`Invalid HTTP method: \"${method}\" in \"${rawDefinition}\". Supported methods: ${HTTP_METHODS.join(", ")}.`);
      }

      definitions.push({ method, path: normalizeRoutePath(rawPath) });
    }
  }

  return definitions;
}

function appendRouteHandlers(routeFileContent: string, definitions: RouteDefinition[]) {
  if (definitions.length === 0) {
    return routeFileContent;
  }

  const handlers = definitions
    .filter(({ method, path }) => {
      const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const methodMatcher = new RegExp(`app\\.${method}\\(\\s*\"${escapedPath}\"`);

      return !methodMatcher.test(routeFileContent);
    })
    .map(({ method, path }) => `  app.${method}(\"${path}\", async () => {\n    return {};\n  });`)
    .join("\n\n");

  if (!handlers) {
    return routeFileContent;
  }

  const closeIndex = routeFileContent.lastIndexOf("}");

  if (closeIndex === -1) {
    throw new Error("Route file does not contain a valid function block.");
  }

  const beforeClose = routeFileContent.slice(0, closeIndex).trimEnd();
  const afterClose = routeFileContent.slice(closeIndex);

  return `${beforeClose}\n\n${handlers}\n${afterClose}`;
}

export async function generateRoute(name: string, routeOptions: string[] = []) {
  const modulePath = path.join("src", name);
  const routeFilePath = path.join(modulePath, `${name}.routes.ts`);
  const routeHandlerName = `${toCamelCase(name)}Routes`;

  await fs.mkdir(modulePath, { recursive: true });

  const template = `
import { FastifyInstance } from "fastify"

export default async function ${routeHandlerName}(app: FastifyInstance) {
  
}
`.trim();

  let routeFileContent = template;

  try {
    routeFileContent = await fs.readFile(routeFilePath, "utf-8");
  } catch {
    routeFileContent = template;
  }

  const routeDefinitions = parseRouteDefinitions(routeOptions);
  routeFileContent = appendRouteHandlers(routeFileContent, routeDefinitions);

  await fs.writeFile(routeFilePath, routeFileContent);

  console.log(`✅ Created module: ${name}`);

  const indexPath = path.join("src", "index.ts");
  const indexContent = await fs.readFile(indexPath, "utf-8");

  const importPath = `"./${name}/${name}.routes"`;
  const importLine = `import ${routeHandlerName} from "./${name}/${name}.routes"`;
  const registerLine = `app.register(${routeHandlerName}, { prefix: "/${name}" })`;

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
  const prefixMatcher = new RegExp(`^app\\.register\\(.+\"/${escapedName}\"\\s*\\}\\s*\\);?$`);
  const existingRegisterIndex = indexLines.findIndex((line) => prefixMatcher.test(line.trim()));

  if (existingRegisterIndex !== -1) {
    indexLines[existingRegisterIndex] = registerLine;
  } else {
    const lastRegisterIndex = [...indexLines]
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.trim().startsWith("app.register("))
      .at(-1)?.index;

    if (lastRegisterIndex === undefined) {
      const autoRoutesCommentIndex = indexLines.findIndex((line) => line.includes("AUTO ROUTES"));

      if (autoRoutesCommentIndex === -1) {
        indexLines.push("", registerLine);
      } else {
        indexLines.splice(autoRoutesCommentIndex + 1, 0, registerLine);
      }
    } else {
      indexLines.splice(lastRegisterIndex + 1, 0, registerLine);
    }
  }

  const updatedContent = indexLines.join("\n");

  await fs.writeFile(indexPath, updatedContent);

  console.log("✅ Route registered in index.ts");

  if (routeDefinitions.length > 0) {
    console.log(`✅ Appended ${routeDefinitions.length} route handler(s) in ${name}.routes.ts`);
  }
}
