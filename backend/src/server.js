import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const startServer = async () => {
  logger.info("server:starting", {
    port: env.port,
    nodeEnv: env.nodeEnv,
    clientUrl: env.clientUrl,
    mongoDbName: env.mongoDbName,
    debugLogs: env.debugLogs,
  });
  await connectDB();

  app.listen(env.port, () => {
    logger.info("server:listening", { port: env.port });
    console.log(`Bhojan Setu API running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  logger.error("server:start_failed", { message: error.message, stack: error.stack });
  process.exit(1);
});
