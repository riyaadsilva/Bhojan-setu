import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { requestLogger } from "./middleware/requestLogger.js";
import routes from "./routes/index.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://bhojan-setu-kappa.vercel.app/"
  ],
  credentials: true
}));
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));
app.use(requestLogger);

if (env.nodeEnv !== "test" && !env.debugLogs) {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.json({
    message: "Bhojan Setu API",
    docs: "/api/health",
  });
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
