import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required. Please check your .env file."),
  MONGODB_DB_NAME: z.string().default("bhojan-setu"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().default("replace-with-a-long-random-secret"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  DEBUG_LOGS: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

const validatedEnv = parsedEnv.data;

export const env = {
  port: parseInt(validatedEnv.PORT, 10),
  nodeEnv: validatedEnv.NODE_ENV,
  mongoUri: validatedEnv.MONGODB_URI,
  mongoDbName: validatedEnv.MONGODB_DB_NAME,
  clientUrl: validatedEnv.CLIENT_URL,
  jwtSecret: validatedEnv.JWT_SECRET,
  jwtExpiresIn: validatedEnv.JWT_EXPIRES_IN,
  debugLogs: validatedEnv.DEBUG_LOGS === "true" || validatedEnv.DEBUG_LOGS === "1",
};
