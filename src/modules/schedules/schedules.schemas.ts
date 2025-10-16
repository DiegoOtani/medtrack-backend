import { z } from 'zod';

/**
 * Schema for getting schedules by medication ID
 */
export const getSchedulesByMedicationSchema = z.object({
  params: z.object({
    medicationId: z.string().uuid('ID do medicamento inválido'),
  }),
  query: z.object({
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
  }),
});

/**
 * Schema for getting schedules by user ID
 */
export const getSchedulesByUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('ID do usuário inválido'),
  }),
  query: z.object({
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
  }),
});

/**
 * Schema for updating a schedule
 */
export const updateScheduleSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do agendamento inválido'),
  }),
  body: z.object({
    time: z
      .string()
      .regex(
        /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
        'Horário inválido (formato: HH:MM)'
      )
      .optional(),
    daysOfWeek: z
      .array(
        z.enum([
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
          'SUNDAY',
        ])
      )
      .min(1, 'Selecione pelo menos um dia da semana')
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * Schema for creating a custom schedule
 */
export const createCustomScheduleSchema = z.object({
  body: z.object({
    medicationId: z.string().uuid('ID do medicamento inválido'),
    time: z
      .string()
      .regex(
        /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
        'Horário inválido (formato: HH:MM)'
      ),
    daysOfWeek: z
      .array(
        z.enum([
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
          'SUNDAY',
        ])
      )
      .min(1, 'Selecione pelo menos um dia da semana'),
  }),
});

/**
 * Schema for deleting a schedule
 */
export const deleteScheduleSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do agendamento inválido'),
  }),
});

/**
 * Schema for toggling schedule active status
 */
export const toggleScheduleSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do agendamento inválido'),
  }),
});

export type GetSchedulesByMedicationInput = z.infer<
  typeof getSchedulesByMedicationSchema
>;
export type GetSchedulesByUserInput = z.infer<typeof getSchedulesByUserSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type CreateCustomScheduleInput = z.infer<
  typeof createCustomScheduleSchema
>['body'];
export type DeleteScheduleInput = z.infer<
  typeof deleteScheduleSchema
>['params'];
export type ToggleScheduleInput = z.infer<
  typeof toggleScheduleSchema
>['params'];
