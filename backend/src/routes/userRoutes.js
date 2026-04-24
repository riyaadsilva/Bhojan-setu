import { Router } from "express";
import { getUserById, getUsers, updateUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", protect, updateUser);

export default router;
