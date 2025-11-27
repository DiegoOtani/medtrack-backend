import { Frequency, Prisma } from '@prisma/client';
import scheduleHandlers from './handler';
import prisma from '../../shared/lib/prisma';
import { CreateCustomScheduleInput, UpdateScheduleInput } from './schedules.schemas';

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
  startTime?: Date,
  intervalHours?: number | null
) => {
  const time = `${startTime?.getHours()}:${startTime?.getMinutes()}`
  const schedules = scheduleHandlers[frequency](time, intervalHours);

  schedules.forEach((s) =>
    console.log(`\n[createMedicationSchedules] schedule created - Time: ${s.time} - daysOfWeek: ${s.daysOfWeek}`)
  );

  if (schedules.length === 0) {
    return { count: 0, message: 'Nenhum agendamento criado' };
  }

  const dataToInsert = schedules.map((schedule) => ({
    medicationId,
    time: schedule.time,
    daysOfWeek: schedule.daysOfWeek,
  }));

  const createdSchedules = await prisma.medicationSchedule.createMany({
    data: dataToInsert,
  });

  if (createdSchedules.count !== schedules.length) {
    throw new Error('Erro ao criar os agendamentos');
  }

  console.log(`[createMedicationSchedules] schedules successfuly created\n`);

  return createdSchedules;
};

/**
 * Gets all schedules for a medication
 */
export const getSchedulesByMedication = async (medicationId: string, isActive?: boolean) => {
  const where: Prisma.MedicationScheduleWhereInput = {
    medicationId,
  };

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const schedules = await prisma.medicationSchedule.findMany({
    where,
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
        },
      },
    },
    orderBy: {
      time: 'asc',
    },
  });

  return schedules;
};

/**
 * Gets all active schedules for a user's medications
 */
export const getSchedulesByUser = async (userId: string, isActive?: boolean) => {
  const where: Prisma.MedicationScheduleWhereInput = {
    medication: {
      userId,
    },
  };

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const schedules = await prisma.medicationSchedule.findMany({
    where,
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
          frequency: true,
          intervalHours: true,
          startTime: true,
          expiresAt: true,
        },
      },
    },
    orderBy: [
      {
        medication: {
          name: 'asc',
        },
      },
      {
        time: 'asc',
      },
    ],
  });

  return schedules;
};

/**
 * Gets comprehensive sync data for the frontend to operate offline
 * This returns schedules + medication rules needed for local notification scheduling
 */
export const getSyncData = async (userId: string) => {
  const schedules = await prisma.medicationSchedule.findMany({
    where: {
      isActive: true,
      medication: {
        userId,
      },
    },
    select: {
      id: true,
      time: true,
      daysOfWeek: true,
      medicationId: true,
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
          frequency: true,
          startTime: true,
          intervalHours: true,
          expiresAt: true,
          stock: true,
        },
      },
    },
  });

  const settings = await prisma.reminderSettings.findUnique({
    where: { userId },
  });

  return {
    timestamp: new Date().toISOString(),
    schedules: schedules.map(s => ({
      id: s.id,
      medicationId: s.medicationId,
      name: s.medication.name,
      dosage: s.medication.dosage,
      frequency: s.medication.frequency,
      days: s.daysOfWeek,
      time: s.time,
      startDate: s.medication.startTime,
      intervalHours: s.medication.intervalHours,
      endDate: s.medication.expiresAt,
      stock: s.medication.stock
    })),
    settings: settings || {
      enablePush: true,
      reminderBefore: 0
    }
  };
};

/**
 * Gets a single schedule by ID
 */
export const getScheduleById = async (id: string) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id },
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
        },
      },
    },
  });

  if (!schedule) {
    throw new Error('Agendamento não encontrado');
  }

  return schedule;
};

/**
 * Creates a custom schedule for a medication
 */
export const createCustomSchedule = async (data: CreateCustomScheduleInput) => {
  const { medicationId, time, daysOfWeek } = data;

  // Verify medication exists
  const medication = await prisma.medication.findUnique({
    where: { id: medicationId },
  });

  if (!medication) {
    throw new Error('Medicamento não encontrado');
  }

  const schedule = await prisma.medicationSchedule.create({
    data: {
      medicationId,
      time,
      daysOfWeek,
    },
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
        },
      },
    },
  });

  return schedule;
};

/**
 * Updates a schedule
 */
export const updateSchedule = async (id: string, data: UpdateScheduleInput['body']) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new Error('Agendamento não encontrado');
  }

  const updatedSchedule = await prisma.medicationSchedule.update({
    where: { id },
    data,
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
        },
      },
    },
  });

  return updatedSchedule;
};

/**
 * Toggles a schedule's active status
 */
export const toggleSchedule = async (id: string) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new Error('Agendamento não encontrado');
  }

  const newActiveStatus = !schedule.isActive;

  const updatedSchedule = await prisma.medicationSchedule.update({
    where: { id },
    data: {
      isActive: newActiveStatus,
    },
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
        },
      },
    },
  });

  return updatedSchedule;
};

/**
 * Deletes a schedule
 */
export const deleteSchedule = async (id: string) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new Error('Agendamento não encontrado');
  }

  await prisma.medicationSchedule.delete({
    where: { id },
  });

  return { message: 'Agendamento excluído com sucesso' };
};

/**
 * Deletes all schedules for a medication
 */
export const deleteSchedulesByMedication = async (medicationId: string) => {
  const result = await prisma.medicationSchedule.deleteMany({
    where: { medicationId },
  });

  return result;
};
