import { auth } from "@DealFlow360/auth";
import { env } from "@DealFlow360/env/server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { createMarkdownFromOpenApi } from "@scalar/openapi-to-markdown";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new OpenAPIHono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// OpenAPI 3.1 Document Specification
app.doc("/doc", {
  openapi: "3.1.0",
  info: {
    title: "DealFlow360 API Reference",
    version: "1.0.0",
    description:
      "Intelligent, Self-Governing Sales Operations Platform API (Odoo 2026 Grand Finale)",
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local Development Server",
    },
  ],
});

// Interactive Scalar API Documentation UI
app.get(
  "/scalar",
  Scalar({
    url: "/doc",
    pageTitle: "DealFlow360 API Reference",
    theme: "purple",
  }),
);
app.get("/docs", (c) => c.redirect("/scalar"));

// Machine-readable Markdown Documentation for LLMs & AI Coding Agents
app.get("/llms.txt", async (c) => {
  const doc = app.getOpenAPI31Document({
    openapi: "3.1.0",
    info: {
      title: "DealFlow360 API",
      version: "1.0.0",
      description: "DealFlow360 OpenAPI specification formatted for LLMs",
    },
  });
  const markdown = await createMarkdownFromOpenApi(JSON.stringify(doc));
  return c.text(markdown);
});

app.get("/", (c) => {
  return c.json({
    status: "online",
    service: "DealFlow360 API",
    documentation: "/scalar",
    llmReference: "/llms.txt",
  });
});

export default app;
