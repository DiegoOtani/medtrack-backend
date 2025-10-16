import { HistoryAction, Prisma } from '@prisma/client';
import prisma from '../../shared/lib/prisma';
import { CreateHistoryInput } from './history.schemas';

/**
 * Creates a new medication history entry
 */
export const createHistory = async (data: CreateHistoryInput) => {
  const { medicationId, scheduleId, scheduledFor, action, quantity, notes } =
    data;

  const medication = await prisma.medication.findUnique({
    where: { id: medicationId },
  });

  if (!medication) {
    throw new Error('Medicamento não encontrado');
  }

  const history = await prisma.medicationHistory.create({
    data: {
      medicationId,
      scheduleId,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      action,
      quantity,
      notes,
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

  if (
    (action === HistoryAction.TAKEN || action === HistoryAction.DISCARDED) &&
    quantity
  ) {
    await prisma.medication.update({
      where: { id: medicationId },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });
  } else if (action === HistoryAction.RESTOCKED && quantity) {
    await prisma.medication.update({
      where: { id: medicationId },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });
  }

  return history;
};

/**
 * Gets history entries by medication ID
 */
export const getHistoryByMedication = async (
  medicationId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    action?: HistoryAction;
    limit?: number;
  }
) => {
  const where: Prisma.MedicationHistoryWhereInput = {
    medicationId,
  };

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const history = await prisma.medicationHistory.findMany({
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
      createdAt: 'desc',
    },
    take: filters?.limit || 100,
  });

  return history;
};

/**
 * Gets history entries by user ID
 */
export const getHistoryByUser = async (
  userId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    action?: HistoryAction;
    limit?: number;
  }
) => {
  const where: Prisma.MedicationHistoryWhereInput = {
    medication: {
      userId,
    },
  };

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const history = await prisma.medicationHistory.findMany({
    where,
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
          userId: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: filters?.limit || 100,
  });

  return history;
};

/**
 * Gets a single history entry by ID
 */
export const getHistoryById = async (id: string) => {
  const history = await prisma.medicationHistory.findUnique({
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

  if (!history) {
    throw new Error('Histórico não encontrado');
  }

  return history;
};

/**
 * Deletes a history entry
 */
export const deleteHistory = async (id: string) => {
  const history = await prisma.medicationHistory.findUnique({
    where: { id },
  });

  if (!history) {
    throw new Error('Histórico não encontrado');
  }

  await prisma.medicationHistory.delete({
    where: { id },
  });

  return { message: 'Histórico excluído com sucesso' };
};

/**
 * Gets medication adherence statistics
 */
export const getAdherenceStats = async (
  medicationId: string,
  startDate?: string,
  endDate?: string
) => {
  const where: Prisma.MedicationHistoryWhereInput = {
    medicationId,
    action: {
      in: [HistoryAction.TAKEN, HistoryAction.SKIPPED, HistoryAction.MISSED],
    },
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const history = await prisma.medicationHistory.findMany({
    where,
    select: {
      action: true,
    },
  });

  const total = history.length;
  const taken = history.filter((h) => h.action === HistoryAction.TAKEN).length;
  const skipped = history.filter(
    (h) => h.action === HistoryAction.SKIPPED
  ).length;
  const missed = history.filter(
    (h) => h.action === HistoryAction.MISSED
  ).length;

  return {
    total,
    taken,
    skipped,
    missed,
    adherenceRate: total > 0 ? ((taken / total) * 100).toFixed(2) : '0.00',
  };
};
