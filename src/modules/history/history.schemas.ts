import { z } from 'zod';
import { HistoryAction } from '@prisma/client';

/**
 * Schema for creating a medication history entry
 */
export const createHistorySchema = z.object({
  body: z.object({
    medicationId: z.string().uuid('ID do medicamento inválido'),
    scheduleId: z.string().uuid('ID do agendamento inválido').optional(),
    scheduledFor: z.string().datetime('Data agendada inválida').optional(),
    action: z.nativeEnum(HistoryAction, {
      errorMap: () => ({ message: 'Ação inválida' }),
    }),
    quantity: z
      .number()
      .int()
      .positive('Quantidade deve ser positiva')
      .optional(),
    notes: z
      .string()
      .max(500, 'Notas devem ter no máximo 500 caracteres')
      .optional(),
  }),
});

/**
 * Schema for getting history by medication ID
 */
export const getHistoryByMedicationSchema = z.object({
  params: z.object({
    medicationId: z.string().uuid('ID do medicamento inválido'),
  }),
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    action: z.nativeEnum(HistoryAction).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

/**
 * Schema for getting history by user ID
 */
export const getHistoryByUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('ID do usuário inválido'),
  }),
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    action: z.nativeEnum(HistoryAction).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

/**
 * Schema for deleting a history entry
 */
export const deleteHistorySchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do histórico inválido'),
  }),
});

export type CreateHistoryInput = z.infer<typeof createHistorySchema>['body'];
export type GetHistoryByMedicationInput = z.infer<
  typeof getHistoryByMedicationSchema
>;
export type GetHistoryByUserInput = z.infer<typeof getHistoryByUserSchema>;
export type DeleteHistoryInput = z.infer<typeof deleteHistorySchema>['params'];
