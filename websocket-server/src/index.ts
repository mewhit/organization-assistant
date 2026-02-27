import WebSocket from "ws";
import * as dotenv from "dotenv";
import { Effect } from "effect";
import { CommandOrchestratorService } from "./command-orchestrator.service";

dotenv.config();

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: Number(PORT) });

type CommandExecuteMessage = {
  type: "command_execute";
  payload: {
    organizationLlmId: string;
    command: string;
  };
};

type SocketMessage = CommandExecuteMessage;

function sendJson(ws: WebSocket, payload: unknown) {
  ws.send(JSON.stringify(payload));
}

function parseIncomingMessage(message: Buffer): SocketMessage {
  const parsed = JSON.parse(message.toString()) as Partial<CommandExecuteMessage>;

  if (
    parsed?.type !== "command_execute" ||
    typeof parsed.payload?.organizationLlmId !== "string" ||
    typeof parsed.payload?.command !== "string"
  ) {
    throw new Error("Invalid message. Expected { type: 'command_execute', payload: { organizationLlmId, command } }");
  }

  return {
    type: "command_execute",
    payload: {
      organizationLlmId: parsed.payload.organizationLlmId,
      command: parsed.payload.command,
    },
  };
}

const handleMessage = (ws: WebSocket, message: Buffer) =>
  Effect.sync(() => {
    CommandOrchestratorService.executeCommand(parseIncomingMessage(message).payload, {
      onIteration: (iterationEvent) => {
        sendJson(ws, {
          type: "command_iteration",
          payload: iterationEvent,
        });
      },
    })
      .then((result) => {
        sendJson(ws, {
          type: "command_final",
          payload: result,
        });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown error";
        sendJson(ws, {
          type: "command_error",
          payload: { message },
        });
      });
  });

// Effect for handling connection
const handleConnection = (ws: WebSocket) =>
  Effect.sync(() => {
    console.log("Client connected");

    ws.on("message", (message: Buffer) => {
      Effect.runSync(handleMessage(ws, message));
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

// Effect for starting the server
const startServer = Effect.sync(() => {
  wss.on("connection", (ws: WebSocket) => {
    Effect.runSync(handleConnection(ws));
  });

  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

// Run the server
Effect.runSync(startServer);
