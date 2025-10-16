import request from 'supertest';
import app from '../../app';

jest.mock('../../shared/lib/prisma', () => ({
  medicationSchedule: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  medication: {
    findUnique: jest.fn(),
  },
}));

import prisma from '../../shared/lib/prisma';

describe('Schedules API (mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/schedules', () => {
    it('Deve criar um agendamento customizado', async () => {
      (prisma.medication.findUnique as jest.Mock).mockResolvedValue({
        id: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
        name: 'Paracetamol',
      });

      (prisma.medicationSchedule.create as jest.Mock).mockResolvedValue({
        id: 'f1a2b3c4-d5e6-47f8-a9b0-c1d2e3f4a5b6',
        medicationId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
        time: '14:00',
        daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
          name: 'Paracetamol',
          dosage: '500mg',
        },
      });

      const response = await request(app)
        .post('/api/schedules')
        .send({
          medicationId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
          time: '14:00',
          daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.time).toBe('14:00');
      expect(response.body.data.daysOfWeek).toEqual([
        'MONDAY',
        'WEDNESDAY',
        'FRIDAY',
      ]);
      expect(prisma.medicationSchedule.create).toHaveBeenCalledTimes(1);
    });

    it('Deve retornar erro 400 com medicationId inválido', async () => {
      const response = await request(app)
        .post('/api/schedules')
        .send({
          medicationId: 'invalid-uuid',
          time: '14:00',
          daysOfWeek: ['MONDAY'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Deve retornar erro 400 com formato de hora inválido', async () => {
      const response = await request(app)
        .post('/api/schedules')
        .send({
          medicationId: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
          time: '25:00',
          daysOfWeek: ['MONDAY'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Deve retornar erro 400 com daysOfWeek vazio', async () => {
      const response = await request(app).post('/api/schedules').send({
        medicationId: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8',
        time: '14:00',
        daysOfWeek: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Deve retornar erro 400 quando medicamento não existe', async () => {
      (prisma.medication.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/schedules')
        .send({
          medicationId: 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9',
          time: '14:00',
          daysOfWeek: ['MONDAY'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/schedules/medication/:medicationId', () => {
    it('Deve listar todos os agendamentos de um medicamento', async () => {
      const mockSchedules = [
        {
          id: 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0',
          medicationId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
          time: '08:00',
          daysOfWeek: ['MONDAY', 'WEDNESDAY'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          medication: {
            id: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
            name: 'Paracetamol',
            dosage: '500mg',
          },
        },
        {
          id: 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1',
          medicationId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
          time: '20:00',
          daysOfWeek: ['MONDAY', 'WEDNESDAY'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          medication: {
            id: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
            name: 'Paracetamol',
            dosage: '500mg',
          },
        },
      ];

      (prisma.medicationSchedule.findMany as jest.Mock).mockResolvedValue(
        mockSchedules
      );

      const response = await request(app).get(
        '/api/schedules/medication/a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(prisma.medicationSchedule.findMany).toHaveBeenCalledTimes(1);
    });

    it('Deve filtrar apenas agendamentos ativos', async () => {
      const mockSchedules = [
        {
          id: 'a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2',
          medicationId: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
          time: '08:00',
          daysOfWeek: ['MONDAY'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          medication: {
            id: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
            name: 'Paracetamol',
            dosage: '500mg',
          },
        },
      ];

      (prisma.medicationSchedule.findMany as jest.Mock).mockResolvedValue(
        mockSchedules
      );

      const response = await request(app).get(
        '/api/schedules/medication/b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7?isActive=true'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every((s: any) => s.isActive === true)).toBe(
        true
      );
    });
  });

  describe('GET /api/schedules/user/:userId', () => {
    it('Deve listar todos os agendamentos de um usuário', async () => {
      const mockSchedules = [
        {
          id: 'b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3',
          medicationId: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8',
          time: '08:00',
          daysOfWeek: ['MONDAY'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          medication: {
            id: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8',
            name: 'Paracetamol',
            dosage: '500mg',
            frequency: 'TWICE_A_DAY',
          },
        },
      ];

      (prisma.medicationSchedule.findMany as jest.Mock).mockResolvedValue(
        mockSchedules
      );

      const response = await request(app).get(
        '/api/schedules/user/c9d0e1f2-a3b4-45c6-d7e8-f9a0b1c2d3e4'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(prisma.medicationSchedule.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/schedules/:id', () => {
    it('Deve buscar agendamento por ID', async () => {
      const mockSchedule = {
        id: 'd0e1f2a3-b4c5-46d7-e8f9-a0b1c2d3e4f5',
        medicationId: 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9',
        time: '08:00',
        daysOfWeek: ['MONDAY'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9',
          name: 'Paracetamol',
          dosage: '500mg',
        },
      };

      (prisma.medicationSchedule.findUnique as jest.Mock).mockResolvedValue(
        mockSchedule
      );

      const response = await request(app).get(
        '/api/schedules/d0e1f2a3-b4c5-46d7-e8f9-a0b1c2d3e4f5'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(
        'd0e1f2a3-b4c5-46d7-e8f9-a0b1c2d3e4f5'
      );
      expect(prisma.medicationSchedule.findUnique).toHaveBeenCalledWith({
        where: { id: 'd0e1f2a3-b4c5-46d7-e8f9-a0b1c2d3e4f5' },
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

    it('Deve retornar erro 404 para agendamento inexistente', async () => {
      (prisma.medicationSchedule.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      const response = await request(app).get(
        '/api/schedules/e1f2a3b4-c5d6-47e8-f9a0-b1c2d3e4f5a6'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/schedules/:id', () => {
    it('Deve atualizar horário do agendamento', async () => {
      (prisma.medicationSchedule.findUnique as jest.Mock).mockResolvedValue({
        id: 'f2a3b4c5-d6e7-48f9-a0b1-c2d3e4f5a6b7',
        time: '08:00',
      });

      (prisma.medicationSchedule.update as jest.Mock).mockResolvedValue({
        id: 'f2a3b4c5-d6e7-48f9-a0b1-c2d3e4f5a6b7',
        medicationId: 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0',
        time: '09:00',
        daysOfWeek: ['MONDAY'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0',
          name: 'Paracetamol',
          dosage: '500mg',
        },
      });

      const response = await request(app)
        .patch('/api/schedules/f2a3b4c5-d6e7-48f9-a0b1-c2d3e4f5a6b7')
        .send({ time: '09:00' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.time).toBe('09:00');
      expect(prisma.medicationSchedule.update).toHaveBeenCalledWith({
        where: { id: 'f2a3b4c5-d6e7-48f9-a0b1-c2d3e4f5a6b7' },
        data: { time: '09:00' },
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

    it('Deve atualizar dias da semana', async () => {
      (prisma.medicationSchedule.findUnique as jest.Mock).mockResolvedValue({
        id: 'a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8',
      });

      (prisma.medicationSchedule.update as jest.Mock).mockResolvedValue({
        id: 'a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8',
        medicationId: 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1',
        time: '08:00',
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1',
          name: 'Paracetamol',
          dosage: '500mg',
        },
      });

      const response = await request(app)
        .patch('/api/schedules/a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8')
        .send({ daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.daysOfWeek).toEqual([
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
      ]);
    });

    it('Deve retornar erro 400 com formato de hora inválido', async () => {
      const response = await request(app)
        .patch('/api/schedules/b4c5d6e7-f8a9-40b1-c2d3-e4f5a6b7c8d9')
        .send({ time: 'invalid-time' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/schedules/:id/toggle', () => {
    it('Deve alternar agendamento de ativo para inativo', async () => {
      (prisma.medicationSchedule.findUnique as jest.Mock).mockResolvedValue({
        id: 'c5d6e7f8-a9b0-41c2-d3e4-f5a6b7c8d9e0',
        isActive: true,
      });

      (prisma.medicationSchedule.update as jest.Mock).mockResolvedValue({
        id: 'c5d6e7f8-a9b0-41c2-d3e4-f5a6b7c8d9e0',
        medicationId: 'a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2',
        time: '08:00',
        daysOfWeek: ['MONDAY'],
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: 'a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2',
          name: 'Paracetamol',
          dosage: '500mg',
        },
      });

      const response = await request(app).patch(
        '/api/schedules/c5d6e7f8-a9b0-41c2-d3e4-f5a6b7c8d9e0/toggle'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    it('Deve retornar erro 400 para agendamento inexistente', async () => {
      (prisma.medicationSchedule.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      const response = await request(app).patch(
        '/api/schedules/d6e7f8a9-b0c1-42d3-e4f5-a6b7c8d9e0f1/toggle'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/schedules/:id', () => {
    it('Deve deletar um agendamento', async () => {
      (prisma.medicationSchedule.findUnique as jest.Mock).mockResolvedValue({
        id: 'e7f8a9b0-c1d2-43e4-f5a6-b7c8d9e0f1a2',
      });

      (prisma.medicationSchedule.delete as jest.Mock).mockResolvedValue({
        id: 'e7f8a9b0-c1d2-43e4-f5a6-b7c8d9e0f1a2',
      });

      const response = await request(app).delete(
        '/api/schedules/e7f8a9b0-c1d2-43e4-f5a6-b7c8d9e0f1a2'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Agendamento excluído com sucesso');
      expect(prisma.medicationSchedule.delete).toHaveBeenCalledWith({
        where: { id: 'e7f8a9b0-c1d2-43e4-f5a6-b7c8d9e0f1a2' },
      });
    });

    it('Deve retornar erro 404 ao deletar agendamento inexistente', async () => {
      (prisma.medicationSchedule.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      const response = await request(app).delete(
        '/api/schedules/f8a9b0c1-d2e3-44f5-a6b7-c8d9e0f1a2b3'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
