import { Router } from "express";
import medicationRoutes from "./modules/medications/medication.routes";
import userRoutes from "./modules/users/user.routes";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({ message: "API is running" });
});

router.use("/medications", medicationRoutes);
router.use("/users", userRoutes);

export default router;