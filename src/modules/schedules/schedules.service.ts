import { Frequency } from '@prisma/client';
import scheduleHandlers from './handler';
import prisma from '../../shared/lib/prisma';

/**
 * Creates the schedules for a medication
 * @param medicationId - The id of the medication to create the schedules for
 * @param frequency - The frequency of the medication
 * @param startTime - The start time of the medication
 * @param intervalHours - The interval hours of the medication
 * @returns The created schedules
 */
export const createMedicationSchedules = async (
  medicationId: string,
  frequency: Frequency,
  startTime?: string,
  intervalHours?: number | null
) => {
  const schedules = scheduleHandlers[frequency](startTime, intervalHours);

  if (schedules.length === 0)
    return { count: 0, message: 'Nenhum agendamento criado' };

  const createdSchedules = await prisma.medicationSchedule.createMany({
    data: schedules.map((schedule) => ({
      medicationId,
      time: schedule.time,
      daysOfWeek: schedule.daysOfWeek,
    })),
  });

  if (createdSchedules.count !== schedules.length) {
    throw new Error('Erro ao criar os agendamentos');
  }

  return createdSchedules;
};
