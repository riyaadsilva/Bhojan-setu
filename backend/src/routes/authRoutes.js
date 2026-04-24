import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { login, me, register } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validate.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window`
  message: { message: "Too many authentication attempts from this IP, please try again after 15 minutes." },
  standardHeaders: true, 
  legacyHeaders: false,
});

const registerSchema = z.object({
  body: z.object({
    role: z.enum(["individual", "restaurant", "ngo"]),
    email: z.string().email(),
    password: z.string().min(6),
  }).passthrough(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    role: z.enum(["individual", "restaurant", "ngo"]).optional(),
  }).passthrough(),
});

router.post("/register", authLimiter, validateRequest(registerSchema), register);
router.post("/login", authLimiter, validateRequest(loginSchema), login);
router.get("/me", protect, me);

export default router;
