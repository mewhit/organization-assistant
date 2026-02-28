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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractTextFromOutput(output: unknown): string | null {
  if (!Array.isArray(output)) {
    return null;
  }

  const texts: string[] = [];

  for (const item of output) {
    if (!isObjectRecord(item)) {
      continue;
    }

    if (typeof item.text === "string" && item.text.trim().length > 0) {
      texts.push(item.text);
    }

    if (!Array.isArray(item.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (!isObjectRecord(contentItem)) {
        continue;
      }

      if (typeof contentItem.text === "string" && contentItem.text.trim().length > 0) {
        texts.push(contentItem.text);
      }
    }
  }

  if (texts.length === 0) {
    return null;
  }

  return texts.join("\n\n");
}

function extractResponseText(response: Record<string, unknown>): string | null {
  if (typeof response.output_text === "string" && response.output_text.trim().length > 0) {
    return response.output_text;
  }

  if (!("output" in response)) {
    return null;
  }

  return extractTextFromOutput(response.output);
}

function extractFinalOutput(result: unknown): unknown {
  if (!isObjectRecord(result)) {
    return result;
  }

  const response = result.response;

  if (!isObjectRecord(response)) {
    return result;
  }

  const finalResponse = response.finalResponse;

  if (isObjectRecord(finalResponse)) {
    const text = extractResponseText(finalResponse);

    if (text) {
      return text;
    }

    if ("output" in finalResponse) {
      return finalResponse.output;
    }
  }

  const responseText = extractResponseText(response);
  if (responseText) {
    return responseText;
  }

  if ("output" in response) {
    return response.output;
  }

  return response;
}

function extractLatestResponseId(result: unknown): string | null {
  if (!isObjectRecord(result)) {
    return null;
  }

  const response = result.response;

  if (!isObjectRecord(response)) {
    return null;
  }

  const finalResponse = response.finalResponse;

  if (isObjectRecord(finalResponse) && typeof finalResponse.id === "string") {
    return finalResponse.id;
  }

  if (typeof response.id === "string") {
    return response.id;
  }

  return null;
}

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

const handleMessage = (
  ws: WebSocket,
  message: Buffer,
  previousResponseId: string | null,
  onResponseId: (id: string) => void,
) =>
  Effect.sync(() => {
    CommandOrchestratorService.executeCommand(parseIncomingMessage(message).payload, {
      previousResponseId: previousResponseId ?? undefined,
      onIteration: (iterationEvent) => {
        sendJson(ws, {
          type: "command_iteration",
          payload: {
            output: iterationEvent.functionCalls.map((functionCall) => functionCall.result),
          },
        });
      },
    })
      .then((result) => {
        const latestResponseId = extractLatestResponseId(result);
        if (latestResponseId) {
          onResponseId(latestResponseId);
        }

        sendJson(ws, {
          type: "command_final",
          payload: {
            output: extractFinalOutput(result),
          },
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
    let previousResponseId: string | null = null;

    ws.on("message", (message: Buffer) => {
      Effect.runSync(
        handleMessage(ws, message, previousResponseId, (responseId) => {
          previousResponseId = responseId;
        }),
      );
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
