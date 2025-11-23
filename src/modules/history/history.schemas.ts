import { z } from 'zod';

// Define o enum localmente para evitar problemas de import do Prisma
enum HistoryAction {
  TAKEN = 'TAKEN',
  SKIPPED = 'SKIPPED',
  MISSED = 'MISSED',
  POSTPONED = 'POSTPONED',
  EXPIRED = 'EXPIRED',
  RESTOCKED = 'RESTOCKED',
  DISCARDED = 'DISCARDED',
}

/**
 * Schema for creating a medication history entry
 */
export const createHistorySchema = z.object({
  body: z
    .object({
      medicationId: z.string().uuid('ID do medicamento inválido').optional(),
      scheduleId: z
        .string()
        .min(1, 'ID do agendamento é obrigatório')
        .refine(
          (val) => {
            // Aceita UUIDs válidos ou IDs no formato "schedule-*"
            return (
              val.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
              val.startsWith('schedule-') ||
              val.startsWith('sched-')
            );
          },
          {
            message:
              'ID do agendamento deve ser um UUID válido ou começar com "schedule-" ou "sched-"',
          }
        )
        .optional(),
      scheduledFor: z.string().datetime('Data agendada inválida').optional(),
      action: z.nativeEnum(HistoryAction, {
        errorMap: () => ({ message: 'Ação inválida' }),
      }),
      quantity: z.number().int().positive('Quantidade deve ser positiva').optional(),
      notes: z.string().max(500, 'Notas devem ter no máximo 500 caracteres').optional(),
    })
    .refine(
      (data) => {
        // Pelo menos um dos dois deve estar presente: medicationId ou scheduleId
        return data.medicationId || data.scheduleId;
      },
      {
        message: 'É necessário fornecer medicationId ou scheduleId',
        path: ['medicationId'], // Erro será associado ao medicationId
      }
    ),
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
export type GetHistoryByMedicationInput = z.infer<typeof getHistoryByMedicationSchema>;
export type GetHistoryByUserInput = z.infer<typeof getHistoryByUserSchema>;
export type DeleteHistoryInput = z.infer<typeof deleteHistorySchema>['params'];
