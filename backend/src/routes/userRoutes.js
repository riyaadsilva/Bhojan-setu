import { Router } from "express";
import { getUserById, getUsers, updateUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// GET /users — requires auth; controller filters to self unless role is explicitly queried
router.get("/", protect, getUsers);
// GET /users/:id — requires auth; controller enforces self-only via userController
router.get("/:id", protect, getUserById);
router.patch("/:id", protect, updateUser);

export default router;
