import { Router } from "express";
import {
  createUserHandler,
  getUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
  loginUserHandler,
} from "./user.controller";

const router = Router();

router.get("/", getUsersHandler);
router.get("/:id", getUserByIdHandler);
router.post("/", createUserHandler);
router.post("/login", loginUserHandler);
router.put("/:id", updateUserHandler);
router.delete("/:id", deleteUserHandler);

export default router;
