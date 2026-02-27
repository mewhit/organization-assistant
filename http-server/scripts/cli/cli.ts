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
    "Action to generate. For routes use HTTP methods (e.g. -a get -a post). For storage use insert|del|update|findOne|all.",
    (value: string, previous: string[] = []) => [...previous, value],
    [],
  )
  .option(
    "-r, --route <definition>",
    "Route definition (method|path) or grouped methods (method|method|path). Repeat -r for multiple routes.",
    (value: string, previous: string[] = []) => [...previous, value],
    [],
  )
  .option("-s, --service", "For route generation, map generated handlers to service methods")
  .action(async (type: "route" | "storage" | "crud", name: string, options: { route: string[]; action: string[]; service?: boolean }) => {
    const rootActionRoutes = options.action.map((method) => `${method}|/`);
    const routeDefinitions = [...rootActionRoutes, ...options.route];

    if (type === "route" && options.service && options.action.length === 0) {
      throw new Error("Invalid flags: -s can only be used when -a is provided.");
    }

    switch (type) {
      case "route":
        await generateRoute(name, routeDefinitions, {
          autoCrud: options.action.length > 0,
          useService: !!options.service,
        });
        break;
      case "storage":
        await generateStorage(name, options.action);
        break;
      case "crud":
        await generateCrud(name);
        break;
    }
  });

program.parse();
