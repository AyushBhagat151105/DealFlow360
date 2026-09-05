import { Hono } from "hono";
import {
  getPortalQuoteController,
  addPortalCommentController,
  submitPortalCounterController,
  confirmPortalQuoteController,
} from "../controllers/portal.controller";

export const portalRoutes = new Hono();

portalRoutes.get("/quote/:token", getPortalQuoteController);
portalRoutes.post("/quote/:token/comment", addPortalCommentController);
portalRoutes.post("/quote/:token/counter", submitPortalCounterController);
portalRoutes.post("/quote/:token/confirm", confirmPortalQuoteController);

