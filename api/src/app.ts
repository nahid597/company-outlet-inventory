import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/not-found.middleware";
import apiRouter from "./routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  // Minimal request log for local development visibility.
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api/v1", apiRouter);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Management System API", env: env.NODE_ENV });
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
