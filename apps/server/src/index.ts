import { auth } from "@DealFlow360/auth";
import { env } from "@DealFlow360/env/server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { createMarkdownFromOpenApi } from "@scalar/openapi-to-markdown";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./middlewares/error-handler";
import { catalogRoutes } from "./routes/catalog.routes";
import { quoteRoutes } from "./routes/quote.routes";
import { fulfillmentRoutes } from "./routes/fulfillment.routes";
import { billingRoutes } from "./routes/billing.routes";
import { portalRoutes } from "./routes/portal.routes";
import { dealHealthRoutes } from "./routes/deal-health.routes";

const app = new OpenAPIHono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: (origin) => origin || env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["Set-Cookie"],
    credentials: true,
  }),
);

app.onError(errorHandler);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/catalog", catalogRoutes);
app.route("/api/quotes", quoteRoutes);
app.route("/api/fulfillment", fulfillmentRoutes);
app.route("/api/billing", billingRoutes);
app.route("/api/portal", portalRoutes);
app.route("/api/deal-health", dealHealthRoutes);

app.doc("/doc", {
  openapi: "3.1.0",
  info: {
    title: "DealFlow360 API Reference",
    version: "1.0.0",
    description: "DealFlow360 Sales Operations Engine API",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development Server",
    },
  ],
});

app.get(
  "/scalar",
  Scalar({
    url: "/doc",
    pageTitle: "DealFlow360 API Reference",
    theme: "purple",
  }),
);
app.get("/docs", (c) => c.redirect("/scalar"));

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

export { app };

export default {
  port: env.PORT,
  fetch: app.fetch,
};
