import z from "zod";

export const frequencyEnum = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);

export const medicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: frequencyEnum,
  expiresAt: z.coerce.date(),
  stock: z.number().min(0, "Stock must be at least 0"),
  notes: z.string().optional(),
  userId: z.string().uuid("Invalid userId"),
});

export const partialMedicationSchema = medicationSchema.partial();

export type MedicationSchema = z.infer<typeof medicationSchema>;

export const medicationQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  name: z.string().optional(),
  dosage: z.string().optional(),
  frequency: frequencyEnum.optional(),
  expiresAt: z.coerce.date().optional(),
  stock: z.coerce.number().optional(),
});

export type MedicationQuery = z.infer<typeof medicationQuerySchema>;