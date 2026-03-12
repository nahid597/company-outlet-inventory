import "reflect-metadata";

import app from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./db/data-source";

async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    app.listen(env.PORT, () => {
      console.log(`API running at http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to bootstrap API", error);
    process.exit(1);
  }
}

void bootstrap();
