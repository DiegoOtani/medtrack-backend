import jwt from 'jsonwebtoken';

/**
 * Gera um token JWT válido para testes
 * @param userId - ID do usuário (padrão: 'test-user-id')
 * @param email - Email do usuário (padrão: 'test@example.com')
 * @returns Token JWT assinado com o mesmo secret usado na aplicação
 */
export function generateTestToken(
  userId: string = 'test-user-id',
  email: string = 'test@example.com'
): string {
  // Usa o mesmo secret que jwt.ts para garantir compatibilidade
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  // Payload compatível com TokenPayload de jwt.ts
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Dados de medicamento válido para testes
 */
export const validMedicationData = {
  name: 'Paracetamol',
  dosage: '500mg',
  frequency: 'TWICE_A_DAY' as const,
  expiresAt: new Date('2025-12-31'),
  stock: 30,
  startTime: '08:00',
  intervalHours: 8,
  notes: 'Tomar com água',
};

/**
 * Dados de usuário válido para testes
 */
export const validUserData = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Test123!@#',
};

/**
 * Dados de histórico válido para testes
 */
export const validHistoryData = {
  medicationId: 'test-medication-id',
  scheduleId: 'test-schedule-id',
  action: 'TAKEN' as const,
  quantity: 1,
  notes: 'Dose tomada conforme prescrito',
};

/**
 * Mock de medicamento retornado do banco
 */
export const mockMedication = {
  id: 'test-medication-id',
  userId: 'test-user-id',
  name: 'Paracetamol',
  dosage: '500mg',
  frequency: 'TWICE_A_DAY' as const,
  expiresAt: new Date('2025-12-31'),
  stock: 30,
  startTime: '08:00',
  intervalHours: 8,
  notes: 'Tomar com água',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock de schedule retornado do banco
 */
export const mockSchedule = {
  id: 'test-schedule-id',
  medicationId: 'test-medication-id',
  time: '08:00',
  daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock de usuário retornado do banco
 */
export const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  password: '$2b$10$hashedpassword', // bcrypt hash
  createdAt: new Date(),
  updatedAt: new Date(),
};
