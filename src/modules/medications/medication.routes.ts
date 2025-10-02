import { Router } from "express";
import {
  createMedicationHandler,
  getMedicationsHandler,
  getMedicationByIdHandler,
  updateMedicationHandler,
  deleteMedicationHandler,
} from "./medication.controller";

const router = Router();

router.post("/", createMedicationHandler);
router.get("/", getMedicationsHandler);
router.get("/:id", getMedicationByIdHandler);
router.put("/:id", updateMedicationHandler);
router.delete("/:id", deleteMedicationHandler);

export default router;
