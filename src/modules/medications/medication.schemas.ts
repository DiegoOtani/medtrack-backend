import z from 'zod';

export const frequencyEnum = z.enum([
  'ONE_TIME',
  'TWICE_A_DAY',
  'THREE_TIMES_A_DAY',
  'FOUR_TIMES_A_DAY',
  'EVERY_OTHER_DAY',
  'WEEKLY',
  'MONTHLY',
  'AS_NEEDED',
  'CUSTOM',
]);

export const medicationSchema = z.object({
  name: z.string().min(1, 'Nome do medicamento é obrigatório'),
  dosage: z.string().min(1, 'Dosagem do medicamento é obrigatório'),
  frequency: frequencyEnum,
  expiresAt: z.coerce.date(),
  stock: z.number().min(0, 'Estoque do medicamento deve ser pelo menos 0'),
  notes: z.string().optional(),
  startTime: z.string().optional(),
  intervalHours: z
    .number()
    .min(0, 'Intervalo de horas deve ser pelo menos 0')
    .optional(),
  userId: z.string().uuid('ID do usuário inválido'),
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
