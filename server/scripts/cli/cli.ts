#!/usr/bin/env node

import { Command } from "commander";
import { generateRoute } from "./generate-route";
import { generateStorage } from "./generate-storage";
import { generateCrud } from "./generate-crud";

const program = new Command();

program
  .command("generate <type> <name>")
  .option(
    "-a, --action <method>",
    "HTTP method for the module root route. Repeat -a for multiple methods (e.g. -a get -a post).",
    (value: string, previous: string[] = []) => [...previous, value],
    [],
  )
  .option(
    "-r, --route <definition>",
    "Route definition (method|path) or grouped methods (method|method|path). Repeat -r for multiple routes.",
    (value: string, previous: string[] = []) => [...previous, value],
    [],
  )
  .action(async (type: "route" | "storage" | "crud", name: string, options: { route: string[]; action: string[] }) => {
    const rootActionRoutes = options.action.map((method) => `${method}|/`);
    const routeDefinitions = [...rootActionRoutes, ...options.route];

    switch (type) {
      case "route":
        await generateRoute(name, routeDefinitions);
        break;
      case "storage":
        await generateStorage(name);
        break;
      case "crud":
        await generateCrud(name);
        break;
    }
  });

program.parse();
