import request from 'supertest';
import app from '../../app';
import { generateTestToken } from '../../../tests/helpers';
import prisma from '../../shared/lib/prisma';

// Mock do Prisma
jest.mock('../../shared/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    deviceToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    scheduledNotification: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    reminderSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const TEST_USER_ID = 'test-user-id';
let authToken: string;

describe('Notification Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authToken = generateTestToken(TEST_USER_ID);

    // Mock padrão do usuário autenticado
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: TEST_USER_ID,
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock padrão do deviceToken.deleteMany
    (prisma.deviceToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

    // Mock padrão do deviceToken.create
    (prisma.deviceToken.create as jest.Mock).mockResolvedValue({
      id: 'device-token-123',
      token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      platform: 'ios',
      userId: TEST_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('POST /api/notifications/register-device', () => {
    it('should register a device token', async () => {
      const response = await request(app)
        .post('/api/notifications/register-device')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
          platform: 'ios',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('deviceToken');
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .post('/api/notifications/register-device')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          token: '', // Token vazio vai falhar na validação Zod
          platform: 'ios',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/notifications/schedule', () => {
    it('should schedule a notification', async () => {
      // Mock deviceTokens do usuário
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'device-1',
          token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
          platform: 'ios',
          userId: TEST_USER_ID,
        },
      ]);

      // Mock reminderSettings
      (prisma.reminderSettings.findUnique as jest.Mock).mockResolvedValue({
        id: 'settings-123',
        userId: TEST_USER_ID,
        enablePush: true,
        reminderBefore: 15,
        quietHoursStart: null,
        quietHoursEnd: null,
      });

      // Mock da criação de notificação
      (prisma.scheduledNotification.create as jest.Mock).mockResolvedValue({
        id: 'notification-123',
        medicationId: 'med-123',
        scheduleId: 'sched-123',
        userId: TEST_USER_ID,
        scheduledTime: new Date('2025-12-01T08:00:00.000Z'),
        medicationName: 'Paracetamol',
        dosage: '500mg',
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/notifications/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationId: 'med-123',
          scheduleId: 'sched-123',
          scheduledTime: '2025-12-01T08:00:00.000Z',
          medicationName: 'Paracetamol',
          dosage: '500mg',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('notification');
    });
  });

  describe('PUT /api/notifications/settings', () => {
    it('should update notification settings', async () => {
      // Mock do findUnique (busca settings existentes)
      (prisma.reminderSettings.findUnique as jest.Mock).mockResolvedValue({
        id: 'settings-123',
        userId: TEST_USER_ID,
        enablePush: false,
        enableEmail: false,
        reminderBefore: 15,
        quietHoursStart: null,
        quietHoursEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock do update (atualiza settings)
      (prisma.reminderSettings.update as jest.Mock).mockResolvedValue({
        id: 'settings-123',
        userId: TEST_USER_ID,
        enablePush: true,
        enableEmail: false,
        reminderBefore: 30,
        quietHoursStart: null,
        quietHoursEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .put('/api/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          enablePush: true,
          reminderBefore: 30,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('settings');
      expect(response.body.settings.enablePush).toBe(true);
      expect(response.body.settings.reminderBefore).toBe(30);
    });
  });
});
