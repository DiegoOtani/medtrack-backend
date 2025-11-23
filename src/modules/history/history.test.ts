import request from 'supertest';
import app from '../../app';
import { HistoryAction } from '@prisma/client';
import { generateTestToken } from '../../../tests/helpers';

jest.mock('../../shared/lib/prisma', () => ({
  medication: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  medicationHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}));

import prisma from '../../shared/lib/prisma';

describe('History API - createHistory (mocked)', () => {
  let authToken: string;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = generateTestToken('test-user-id');

    // Mock do usuário autenticado para o middleware
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('POST /api/history', () => {
    it('Deve criar um histórico com ação TAKEN e decrementar estoque', async () => {
      (prisma.medication.findUnique as jest.Mock).mockResolvedValue({
        medicationId: 'e4eaaaf2-d142-11e1-b3e4-080027620cdd',
        name: 'Paracetamol',
        dosage: '500mg',
        stock: 100,
      });

      (prisma.medicationHistory.create as jest.Mock).mockResolvedValue({
        id: 'hist-1',
        medicationId: 'e4eaaaf2-d142-11e1-b3e4-080027620cdd',
        scheduleId: '0e5e1a2b-c752-4f8a-b12b-3a2a4fbf6633',
        scheduledFor: new Date('2024-01-15T08:00:00Z'),
        action: HistoryAction.TAKEN,
        quantity: 1,
        notes: 'Tomado no café da manhã',
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: 'med-123',
          name: 'Paracetamol',
          dosage: '500mg',
        },
      });

      (prisma.medication.update as jest.Mock).mockResolvedValue({
        medicationId: 'e4eaaaf2-d142-11e1-b3e4-080027620cdd',
        stock: 99,
      });

      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'e4eaaaf2-d142-11e1-b3e4-080027620cdd',
          scheduleId: '0e5e1a2b-c752-4f8a-b12b-3a2a4fbf6633',
          scheduledFor: '2024-01-15T08:00:00Z',
          action: HistoryAction.TAKEN,
          quantity: 1,
          notes: 'Tomado no café da manhã',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe(HistoryAction.TAKEN);
      expect(response.body.data.quantity).toBe(1);
      expect(prisma.medicationHistory.create).toHaveBeenCalledTimes(1);
      expect(prisma.medication.update).toHaveBeenCalledWith({
        where: { id: 'e4eaaaf2-d142-11e1-b3e4-080027620cdd' },
        data: {
          stock: {
            decrement: 1,
          },
        },
      });
    });

    it('Deve criar um histórico com ação DISCARDED e decrementar estoque', async () => {
      (prisma.medication.findUnique as jest.Mock).mockResolvedValue({
        id: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
        name: 'Paracetamol',
        stock: 100,
      });

      (prisma.medicationHistory.create as jest.Mock).mockResolvedValue({
        id: 'hist-2',
        medicationId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
        scheduleId: null,
        scheduledFor: null,
        action: HistoryAction.DISCARDED,
        quantity: 5,
        notes: 'Comprimidos vencidos descartados',
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
          name: 'Paracetamol',
          dosage: '500mg',
        },
      });

      (prisma.medication.update as jest.Mock).mockResolvedValue({
        id: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
        stock: 95,
      });

      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
          action: HistoryAction.DISCARDED,
          quantity: 5,
          notes: 'Comprimidos vencidos descartados',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe(HistoryAction.DISCARDED);
      expect(response.body.data.quantity).toBe(5);
      expect(prisma.medicationHistory.create).toHaveBeenCalledTimes(1);
    });

    it('Deve criar um histórico com ação RESTOCKED e incrementar estoque', async () => {
      (prisma.medication.findUnique as jest.Mock).mockResolvedValue({
        id: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
        name: 'Paracetamol',
        stock: 50,
      });

      (prisma.medicationHistory.create as jest.Mock).mockResolvedValue({
        id: 'hist-3',
        medicationId: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
        scheduleId: null,
        scheduledFor: null,
        action: HistoryAction.RESTOCKED,
        quantity: 30,
        notes: 'Compra na farmácia',
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
          name: 'Paracetamol',
          dosage: '500mg',
        },
      });

      (prisma.medication.update as jest.Mock).mockResolvedValue({
        id: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
        stock: 80,
      });

      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
          action: HistoryAction.RESTOCKED,
          quantity: 30,
          notes: 'Compra na farmácia',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe(HistoryAction.RESTOCKED);
      expect(prisma.medication.update).toHaveBeenCalledWith({
        where: { id: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7' },
        data: {
          stock: {
            increment: 30,
          },
        },
      });
    });

    it('Deve criar um histórico com ação SKIPPED sem alterar estoque', async () => {
      (prisma.medication.findUnique as jest.Mock).mockResolvedValue({
        id: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8',
        name: 'Paracetamol',
      });

      (prisma.medicationHistory.create as jest.Mock).mockResolvedValue({
        id: 'hist-4',
        medicationId: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8',
        scheduleId: 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9',
        scheduledFor: new Date('2024-01-15T08:00:00Z'),
        action: HistoryAction.SKIPPED,
        quantity: null,
        notes: 'Esqueci de tomar',
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8',
          name: 'Paracetamol',
          dosage: '500mg',
        },
      });

      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8',
          scheduleId: 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9',
          scheduledFor: '2024-01-15T08:00:00Z',
          action: HistoryAction.SKIPPED,
          notes: 'Esqueci de tomar',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe(HistoryAction.SKIPPED);
      expect(prisma.medication.update).not.toHaveBeenCalled();
    });

    it('Deve criar um histórico com ação MISSED sem alterar estoque', async () => {
      (prisma.medication.findUnique as jest.Mock).mockResolvedValue({
        id: 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0',
        name: 'Paracetamol',
      });

      (prisma.medicationHistory.create as jest.Mock).mockResolvedValue({
        id: 'hist-5',
        medicationId: 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0',
        scheduleId: 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1',
        scheduledFor: new Date('2024-01-15T08:00:00Z'),
        action: HistoryAction.MISSED,
        quantity: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0',
          name: 'Paracetamol',
          dosage: '500mg',
        },
      });

      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0',
          scheduleId: 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1',
          scheduledFor: '2024-01-15T08:00:00Z',
          action: HistoryAction.MISSED,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe(HistoryAction.MISSED);
      expect(prisma.medication.update).not.toHaveBeenCalled();
    });

    it('Deve retornar erro 400 quando medicamento não existe', async () => {
      (prisma.medication.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2',
          action: HistoryAction.TAKEN,
          quantity: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Medicamento não encontrado');
      expect(prisma.medicationHistory.create).not.toHaveBeenCalled();
    });

    it('Deve retornar erro 400 com medicationId inválido', async () => {
      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'invalid-uuid',
          action: HistoryAction.TAKEN,
          quantity: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Deve retornar erro 400 com action inválida', async () => {
      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3',
          action: 'INVALID_ACTION',
          quantity: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Deve retornar erro 400 com quantity negativa', async () => {
      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'c9d0e1f2-a3b4-45c6-d7e8-f9a0b1c2d3e4',
          action: HistoryAction.TAKEN,
          quantity: -1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Deve retornar erro 400 com notes muito longo', async () => {
      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'd0e1f2a3-b4c5-46d7-e8f9-a0b1c2d3e4f5',
          action: HistoryAction.TAKEN,
          quantity: 1,
          notes: 'a'.repeat(501),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Deve criar histórico sem campos opcionais', async () => {
      (prisma.medication.findUnique as jest.Mock).mockResolvedValue({
        id: 'e1f2a3b4-c5d6-47e8-f9a0-b1c2d3e4f5a6',
        name: 'Paracetamol',
      });

      (prisma.medicationHistory.create as jest.Mock).mockResolvedValue({
        id: 'hist-6',
        medicationId: 'e1f2a3b4-c5d6-47e8-f9a0-b1c2d3e4f5a6',
        scheduleId: null,
        scheduledFor: null,
        action: HistoryAction.SKIPPED,
        quantity: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: 'e1f2a3b4-c5d6-47e8-f9a0-b1c2d3e4f5a6',
          name: 'Paracetamol',
          dosage: '500mg',
        },
      });

      const response = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'e1f2a3b4-c5d6-47e8-f9a0-b1c2d3e4f5a6',
          action: HistoryAction.SKIPPED,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(prisma.medicationHistory.create).toHaveBeenCalledWith({
        data: {
          medicationId: 'e1f2a3b4-c5d6-47e8-f9a0-b1c2d3e4f5a6',
          scheduleId: undefined,
          scheduledFor: undefined,
          action: HistoryAction.SKIPPED,
          quantity: undefined,
          notes: undefined,
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
    });
  });
});
