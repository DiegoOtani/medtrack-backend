import request from 'supertest';
import app from '../../app';

describe('Notification Module', () => {
  describe('POST /notifications/register-device', () => {
    it('should register a device token', async () => {
      const response = await request(app).post('/notifications/register-device').send({
        token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
        platform: 'ios',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('deviceToken');
    });

    it('should return error for invalid token', async () => {
      const response = await request(app).post('/notifications/register-device').send({
        token: 'invalid-token',
        platform: 'ios',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /notifications/schedule', () => {
    it('should schedule a notification', async () => {
      const response = await request(app).post('/notifications/schedule').send({
        medicationId: 'med-123',
        scheduleId: 'sched-123',
        scheduledTime: new Date().toISOString(),
        medicationName: 'Paracetamol',
        dosage: '500mg',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('notification');
    });
  });

  describe('PUT /notifications/settings', () => {
    it('should update notification settings', async () => {
      const response = await request(app).put('/notifications/settings').send({
        enablePush: true,
        reminderBefore: 30,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('settings');
    });
  });
});
