import { Router } from "express";
import { createNGO, getNGOById, getNGOs, updateNGO } from "../controllers/ngoController.js";

const router = Router();

router.get("/", getNGOs);
router.post("/", createNGO);
router.get("/:id", getNGOById);
router.patch("/:id", updateNGO);

export default router;
