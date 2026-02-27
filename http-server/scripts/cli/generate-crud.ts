import fs from "fs/promises";
import path from "path";
import { generateRoute } from "./generate-route";
import { generateStorage } from "./generate-storage";
import { toCamelCase, toPascalCase } from "./name-case";

function buildServiceTemplate(name: string, className: string, serviceName: string, storageName: string) {
  const entityVarName = toCamelCase(className);

  return `
import { Effect, Option } from "effect";
import { type DbError, UnknownDbError } from "@libs/dbHandler";

import { ${storageName} } from "./${name}.storage";
import { type ${className}, type Creatable${className}, type Updatable${className} } from "./${name}.entity";

export class ${className}NotFound {
  readonly _tag = "${className}NotFound";
}

export class ${className}AlreadyExists {
  readonly _tag = "${className}AlreadyExists";
}

export type ${className}ServiceError = ${className}NotFound | ${className}AlreadyExists | DbError;

export class ${serviceName} {
  static create(payload: Creatable${className}): Effect.Effect<${className}, ${className}ServiceError> {
    return ${storageName}.insert(payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UnknownDbError("${className} not found")),
          onSome: (${entityVarName}) => Effect.succeed(${entityVarName}),
        }),
      ),
    );
  }

  static findOne(id: string): Effect.Effect<${className}, ${className}ServiceError> {
    return ${storageName}.findOne(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new ${className}NotFound()),
          onSome: (${entityVarName}) => Effect.succeed(${entityVarName}),
        }),
      ),
    );
  }

  static find(id: string) {
    return this.findOne(id);
  }

  static update(id: string, payload: Updatable${className}): Effect.Effect<${className}, ${className}ServiceError> {
    return ${storageName}.update(id, payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new ${className}NotFound()),
          onSome: (${entityVarName}) => Effect.succeed(${entityVarName}),
        }),
      ),
    );
  }

  static remove(id: string): Effect.Effect<${className}, ${className}ServiceError> {
    return ${storageName}.del(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new ${className}NotFound()),
          onSome: (${entityVarName}) => Effect.succeed(${entityVarName}),
        }),
      ),
    );
  }
}
`.trim();
}

function buildDtoTemplate(className: string) {
  return `
import { Schema } from "effect";

export const ${className}DtoSchema = Schema.Struct({});

export const Create${className}DtoSchema = Schema.Struct({});

export const Update${className}DtoSchema = Schema.partial(Create${className}DtoSchema);

export type Create${className}Dto = Schema.Schema.Type<typeof Create${className}DtoSchema>;
export type Update${className}Dto = Schema.Schema.Type<typeof Update${className}DtoSchema>;

export type ${className}Dto = Schema.Schema.Type<typeof ${className}DtoSchema>;
`.trim();
}

function buildAppDtoReexportTemplate(name: string) {
  return `
export * from "@libs/dto/${name}.dto";
`.trim();
}

function buildEntityTemplate(className: string) {
  return `
export type ${className} = {};

export type Creatable${className} = {};

export type Updatable${className} = {};
`.trim();
}

export async function generateCrud(name: string) {
  await generateRoute(name, ["get|/:id", "post|/", "patch|/:id", "put|/:id", "delete|/:id"], {
    autoCrud: true,
    useService: true,
  });
  await generateStorage(name, ["all"]);

  const className = toPascalCase(name);
  const serviceName = `${className}Service`;
  const storageName = `${className}Storage`;
  const modulePath = path.join("app", name);
  const libsDtoPath = path.join("libs", "dto");
  const serviceFilePath = path.join(modulePath, `${name}.service.ts`);
  const appDtoFilePath = path.join(modulePath, `${name}.dto.ts`);
  const libsDtoFilePath = path.join(libsDtoPath, `${name}.dto.ts`);
  const entityFilePath = path.join(modulePath, `${name}.entity.ts`);
  const libsDtoIndexPath = path.join(libsDtoPath, "index.ts");

  const serviceTemplate = buildServiceTemplate(name, className, serviceName, storageName);
  const dtoTemplate = buildDtoTemplate(className);
  const appDtoReexportTemplate = buildAppDtoReexportTemplate(name);
  const entityTemplate = buildEntityTemplate(className);

  await fs.mkdir(libsDtoPath, { recursive: true });

  await fs.writeFile(serviceFilePath, serviceTemplate);
  await fs.writeFile(libsDtoFilePath, dtoTemplate);
  await fs.writeFile(appDtoFilePath, appDtoReexportTemplate);
  await fs.writeFile(entityFilePath, entityTemplate);

  let dtoIndexContent = "";
  try {
    dtoIndexContent = await fs.readFile(libsDtoIndexPath, "utf-8");
  } catch {
    dtoIndexContent = "";
  }

  const exportLine = `export * from "./${name}.dto";`;
  if (!dtoIndexContent.includes(exportLine)) {
    const normalized = dtoIndexContent.trim();
    const updatedIndex = normalized ? `${normalized}\n${exportLine}\n` : `${exportLine}\n`;
    await fs.writeFile(libsDtoIndexPath, updatedIndex);
  }

  console.log(`✅ Created CRUD module: ${name}`);
  console.log(
    `✅ Generated ${name}.routes.ts, ${name}.service.ts, app/${name}/${name}.dto.ts (re-export), libs/dto/${name}.dto.ts, ${name}.entity.ts, and ${name}.storage.ts`,
  );
}
