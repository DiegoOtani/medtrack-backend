import * as MedicationService from './medication.service';
import { prismaMock } from '../../../tests/mocks/prisma.mock';
import { mockMedication, mockUser } from '../../../tests/helpers';

// Mock do prisma para usar o prismaMock
jest.mock('../../shared/lib/prisma', () => ({
  __esModule: true,
  default: require('../../../tests/mocks/prisma.mock').prismaMock,
}));

describe('MedicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodayMedications', () => {
    it('deve retornar medicamentos do dia com agendamentos ativos', async () => {
      const userId = mockUser.id;
      const today = new Date();
      const mockSchedules = [
        {
          id: 'schedule-1',
          medicationId: mockMedication.id,
          time: '08:00',
          daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
          isActive: true,
          medication: mockMedication,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.medicationSchedule.findMany.mockResolvedValue(mockSchedules as any);
      prismaMock.medicationHistory.findFirst.mockResolvedValue(null);

      const result = await MedicationService.getTodayMedications(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve retornar array vazio quando não há agendamentos', async () => {
      prismaMock.medicationSchedule.findMany.mockResolvedValue([]);

      const result = await MedicationService.getTodayMedications('user-id');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('updateMedicationStock', () => {
    it('deve atualizar o estoque corretamente', async () => {
      const medicationId = mockMedication.id;
      const updatedStock = mockMedication.stock - 1;

      prismaMock.medication.update.mockResolvedValue({
        ...mockMedication,
        stock: updatedStock,
      } as any);

      const result = await MedicationService.updateMedicationStock(medicationId, updatedStock);

      expect(result.stock).toBe(updatedStock);
      expect(prismaMock.medication.update).toHaveBeenCalledWith({
        where: { id: medicationId },
        data: { stock: updatedStock },
      });
    });

    it('não deve permitir estoque negativo', async () => {
      const medicationId = mockMedication.id;
      const invalidStock = -1;

      await expect(
        MedicationService.updateMedicationStock(medicationId, invalidStock)
      ).rejects.toThrow('Estoque não pode ser negativo');
    });
  });

  describe('getLowStockMedications', () => {
    it('deve retornar medicamentos com estoque baixo', async () => {
      const userId = mockUser.id;
      const lowStockMeds = [
        {
          ...mockMedication,
          stock: 3,
        },
      ];

      prismaMock.medication.findMany.mockResolvedValue(lowStockMeds as any);

      const result = await MedicationService.getLowStockMedications(userId, 5);

      expect(result).toHaveLength(1);
      expect(result[0].stock).toBeLessThanOrEqual(5);
      expect(prismaMock.medication.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          stock: {
            lte: 5,
            gt: 0,
          },
        },
        orderBy: {
          stock: 'asc',
        },
      });
    });

    it('não deve retornar medicamentos com estoque suficiente', async () => {
      prismaMock.medication.findMany.mockResolvedValue([]);

      const result = await MedicationService.getLowStockMedications('user-id');

      expect(result).toEqual([]);
    });
  });

  describe('createMedication', () => {
    it('deve criar um medicamento com dados válidos', async () => {
      const medicationData = {
        name: 'Paracetamol 750mg',
        dosage: '750mg',
        frequency: 'TWICE_A_DAY',
        stock: 30,
        userId: mockUser.id,
      };

      prismaMock.medication.create.mockResolvedValue({
        ...mockMedication,
        ...medicationData,
      } as any);

      const result = await MedicationService.createMedication(medicationData as any);

      expect(result.name).toBe(medicationData.name);
      expect(result.dosage).toBe(medicationData.dosage);
      expect(prismaMock.medication.create).toHaveBeenCalledWith({
        data: medicationData,
      });
    });
  });

  describe('deleteMedication', () => {
    it('deve deletar medicamento e seus relacionamentos', async () => {
      const medicationId = mockMedication.id;

      prismaMock.medicationSchedule.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.medicationHistory.deleteMany.mockResolvedValue({ count: 2 });
      prismaMock.scheduledNotification.deleteMany.mockResolvedValue({ count: 3 });
      prismaMock.medication.delete.mockResolvedValue(mockMedication as any);

      const result = await MedicationService.deleteMedication(medicationId);

      expect(result).toBeDefined();
      expect(prismaMock.medicationSchedule.deleteMany).toHaveBeenCalled();
      expect(prismaMock.medicationHistory.deleteMany).toHaveBeenCalled();
      expect(prismaMock.scheduledNotification.deleteMany).toHaveBeenCalled();
      expect(prismaMock.medication.delete).toHaveBeenCalledWith({
        where: { id: medicationId },
      });
    });
  });

  describe('getOutOfStockMedications', () => {
    it('deve retornar apenas medicamentos sem estoque', async () => {
      const userId = mockUser.id;
      const outOfStockMeds = [
        {
          ...mockMedication,
          stock: 0,
        },
      ];

      prismaMock.medication.findMany.mockResolvedValue(outOfStockMeds as any);

      const result = await MedicationService.getOutOfStockMedications(userId);

      expect(result).toHaveLength(1);
      expect(result[0].stock).toBe(0);
      expect(prismaMock.medication.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          stock: 0,
        },
      });
    });
  });
});
