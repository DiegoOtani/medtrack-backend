import { Router } from "express";
import {
  createUserHandler,
  getUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
  loginUserHandler,
} from "./user.controller";
import { authenticateToken } from "../../shared/middlewares/auth";

const router = Router();

router.get("/", authenticateToken, getUsersHandler);
router.get("/:id", authenticateToken, getUserByIdHandler);
router.post("/", createUserHandler);
router.post("/login", loginUserHandler);
router.put("/:id", authenticateToken, updateUserHandler);
router.delete("/:id", authenticateToken, deleteUserHandler);

export default router;
