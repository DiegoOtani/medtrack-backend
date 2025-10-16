import request from 'supertest';
import app from '../../app';

jest.mock('../../shared/lib/prisma', () => ({
  medication: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  medicationSchedule: {
    createMany: jest.fn(),
  },
}));

import prisma from '../../shared/lib/prisma';

describe('Medication API (mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Deve criar um novo medicamento', async () => {
    const mockDate = new Date('2024-12-31T23:59:59.000Z');
    (prisma.medication.create as jest.Mock).mockResolvedValue({
      id: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
      name: 'Paracetamol',
      dosage: '500mg',
      frequency: 'TWICE_A_DAY',
      expiresAt: mockDate,
      stock: 20,
      notes: 'Tomar com água',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      startTime: '08:00',
      intervalHours: 12,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    (prisma.medicationSchedule.createMany as jest.Mock).mockResolvedValue({
      count: 2,
    });

    const response = await request(app).post('/api/medications').send({
      name: 'Paracetamol',
      dosage: '500mg',
      frequency: 'TWICE_A_DAY',
      expiresAt: mockDate.toISOString(),
      stock: 20,
      notes: 'Tomar com água',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      startTime: '08:00',
      intervalHours: 12,
    });

    expect(response.status).toBe(201);
    expect(prisma.medication.create).toHaveBeenCalledTimes(1);
    expect(response.body.medication.name).toBe('Paracetamol');
    expect(response.body.medication.frequency).toBe('TWICE_A_DAY');
    expect(response.body.medication.startTime).toBe('08:00');
    expect(response.body.medication.intervalHours).toBe(12);
  });

  it('Deve listar medicamentos', async () => {
    (prisma.medication.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
        name: 'Ibuprofeno',
        dosage: '400mg',
        frequency: 'THREE_TIMES_A_DAY',
        expiresAt: new Date('2025-12-31'),
        stock: 10,
        notes: null,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        startTime: '08:00',
        intervalHours: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    (prisma.medication.count as jest.Mock).mockResolvedValue(1);

    const response = await request(app).get('/api/medications');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items[0].name).toBe('Ibuprofeno');
    expect(response.body.items[0].frequency).toBe('THREE_TIMES_A_DAY');
    expect(prisma.medication.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.medication.count).toHaveBeenCalledTimes(1);
  });

  it('Deve buscar medicamento por ID', async () => {
    (prisma.medication.findUnique as jest.Mock).mockResolvedValue({
      id: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8',
      name: 'Dipirona',
      dosage: '1g',
      frequency: 'FOUR_TIMES_A_DAY',
      expiresAt: new Date('2025-06-30'),
      stock: 5,
      notes: 'Tomar em caso de dor',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      startTime: '08:00',
      intervalHours: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app).get(
      '/api/medications/c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'
    );

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Dipirona');
    expect(response.body.frequency).toBe('FOUR_TIMES_A_DAY');
    expect(response.body.startTime).toBe('08:00');
    expect(prisma.medication.findUnique).toHaveBeenCalledWith({
      where: { id: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8' },
    });
  });

  it('Deve atualizar um medicamento', async () => {
    (prisma.medication.update as jest.Mock).mockResolvedValue({
      id: 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9',
      name: 'Amoxicilina',
      dosage: '250mg',
      frequency: 'TWICE_A_DAY',
      expiresAt: new Date('2025-09-15'),
      stock: 15,
      notes: 'Antibiótico',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      startTime: '08:00',
      intervalHours: 12,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app)
      .put('/api/medications/d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9')
      .send({ stock: 15 });

    expect(response.status).toBe(200);
    expect(response.body.medication.stock).toBe(15);
    expect(prisma.medication.update).toHaveBeenCalledWith({
      where: { id: 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9' },
      data: { stock: 15 },
    });
  });

  it('Deve deletar um medicamento', async () => {
    (prisma.medication.delete as jest.Mock).mockResolvedValue({
      id: 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0',
      name: 'Cetirizina',
      dosage: '10mg',
      frequency: 'ONE_TIME',
      expiresAt: new Date('2026-01-10'),
      stock: 30,
      notes: 'Antialérgico',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      startTime: '20:00',
      intervalHours: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app).delete(
      '/api/medications/e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0'
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Medicamento deletado com sucesso');
    expect(prisma.medication.delete).toHaveBeenCalledWith({
      where: { id: 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0' },
    });
  });
});
