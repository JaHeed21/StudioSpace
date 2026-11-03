import { Router } from "express";
import { checkDatabaseConnection } from "../../db/mongodb.js";

export const healthRouter = Router();

healthRouter.get("/", async (_request, response, next) => {
  try {
    await checkDatabaseConnection();
    response.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

