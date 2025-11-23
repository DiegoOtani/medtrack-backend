import { z } from 'zod';

// Schema para registrar token do dispositivo
export const registerDeviceSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token é obrigatório'),
    platform: z.enum(['ios', 'android'], {
      errorMap: () => ({ message: 'Plataforma deve ser ios ou android' }),
    }),
  }),
});

// Schema para agendar notificação
export const scheduleNotificationSchema = z.object({
  body: z.object({
    medicationId: z.string().min(1, 'ID do medicamento é obrigatório'),
    scheduleId: z.string().min(1, 'ID do agendamento é obrigatório'),
    scheduledTime: z.string().datetime('Data/hora deve estar no formato ISO 8601'),
    medicationName: z.string().min(1, 'Nome do medicamento é obrigatório'),
    dosage: z.string().min(1, 'Dosagem é obrigatória'),
  }),
});

// Schema para cancelar notificação
export const cancelNotificationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID da notificação é obrigatório'),
  }),
});

// Schema para atualizar configurações de notificação
export const updateSettingsSchema = z.object({
  body: z.object({
    enablePush: z.boolean().optional(),
    enableEmail: z.boolean().optional(),
    reminderBefore: z.number().int().min(0).max(60).optional(),
    quietHoursStart: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM inválido')
      .nullable()
      .optional(),
    quietHoursEnd: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM inválido')
      .nullable()
      .optional(),
  }),
});

// Tipos inferidos dos schemas
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type ScheduleNotificationInput = z.infer<typeof scheduleNotificationSchema>;
export type CancelNotificationInput = z.infer<typeof cancelNotificationSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
