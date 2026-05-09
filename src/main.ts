import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

import {
  SIDEBRIDGE_VERSION,
  type SBMessageFrom,
  type SBMessageSource,
  type SBMessage,
  type SBOptions,
  type SBRequest,
  type SBResponse,
  createSBMessage,
  createSBOptions,
  createSBResponse,
} from "./sidebridge.js";
import { create } from "node:domain";

// ==========
// Configuration for testing
// ==========

const END_SESSION = false;
const DISABLE_SEND_HISTORY = false;
const SYSTEM_ERROR_TEST = false;
const JSON_ERROR_TEST = false;
const REQUIRED_AUTH_KEY: string | undefined = "test";
const PORT = 3000;

// ==========
// Utilities
// ==========

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  console.log(`\nReceived request: \n${Buffer.concat(chunks).toString("utf8")}`);
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
  console.log(`\nSending response: \n${body}`);
}

function buildResponse(messages: SBMessage[], options?: SBOptions): SBResponse {
  const response: SBResponse = { messages };
  if (options !== undefined) {
    response.options = options;
  }
  return response;
}

function createMessage(from: SBMessageFrom, content: string): SBMessage {
  return createSBMessage({
    id: randomUUID(),
    from,
    content,
  });
}

// ==========
// Handler
// ==========

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  // Method check
  if (request.method !== "POST") {
    const message = createMessage("system", "Method not allowed");
    const sbMsg = createSBMessage(message);
    const sbOpts = createSBOptions({ endSession: true });
    const sbResponse = createSBResponse({ messages: [sbMsg], options: sbOpts });
    sendJson(response, 405, sbResponse);
    return;
  }

  // Error test
  if (JSON_ERROR_TEST) {
    sendJson(response, 200, { test: "This is not valid JSON" });
    return;
  }

  let payload: SBRequest | undefined;

  // Parse JSON body
  try {
    const body = await readBody(request);
    if (body.length > 0) {
      payload = JSON.parse(body) as SBRequest;
    }
  } catch {
    const message = createMessage("system", "Invalid JSON");
    const sbMsg = createSBMessage(message);
    const sbOpts = createSBOptions({ endSession: true });
    const sbResponse = createSBResponse({ messages: [sbMsg], options: sbOpts });
    sendJson(response, 400, sbResponse);
    return;
  }

  // Auth check
  if (REQUIRED_AUTH_KEY !== undefined && request.headers["x-sidebridge-key"] !== REQUIRED_AUTH_KEY) {
    const message = createMessage("system", "Unauthorized");
    const sbMsg = createSBMessage(message);
    const sbOpts = createSBOptions({ endSession: true });
    const sbResponse = createSBResponse({ messages: [sbMsg], options: sbOpts });
    sendJson(response, 401, sbResponse);
    return;
  }

  // System error test
  if (SYSTEM_ERROR_TEST) {
    const message = createMessage("system", "System error");
    const sbMsg = createSBMessage(message);
    const sbResponse = createSBResponse({ messages: [sbMsg] });
    sendJson(response, 200, sbResponse);
    return;
  }

  // Create yamabico response
  const messages = payload?.messages ?? [];
  const echoMessages = messages
    .filter((m) => m.from === "user" && m.content.length > 0)
    .map((m) => {
      const content = `${m.content}...`;
      const msg = createMessage("assistant", content);
      return createSBMessage(msg);
    });

  // Create options
  const options: SBOptions = createSBOptions({
    endSession: END_SESSION,
    disableSendHistory: DISABLE_SEND_HISTORY,
  });

  const respObj: SBResponse = createSBResponse({
    messages: echoMessages,
    options,
  });
  
  const sbResponse = createSBResponse(respObj);
  sendJson(response, 200, sbResponse);
}

// ==========
// Server
// ==========

const server = createServer((request, response) => {
  void handleRequest(request, response).catch((error) => {
    const errorText = error instanceof Error ? error.message : "Unknown error";
    const message = createMessage("system", errorText);
    const sbOpts = createSBOptions({ endSession: true });
    const sbResponse = buildResponse([message], sbOpts);
    sendJson(response, 500, sbResponse);
  });
});

server.listen(PORT, () => {
  console.log(`SideBridge test server yamabico running at http://127.0.0.1:${PORT}`);
  console.log(`Protocol version: ${SIDEBRIDGE_VERSION}`);
});
