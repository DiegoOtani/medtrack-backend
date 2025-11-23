import request from 'supertest';
import app from '../../app';
import { generateTestToken } from '../../../tests/helpers';

jest.mock('../../shared/lib/prisma', () => ({
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('../../shared/middlewares/rate-limit', () => ({
  authRateLimit: (req: any, res: any, next: any) => next(),
  medicationRateLimit: (req: any, res: any, next: any) => next(),
  apiRateLimit: (req: any, res: any, next: any) => next(),
}));

import prisma from '../../shared/lib/prisma';
import bcrypt from 'bcrypt';

describe('User API (mocked)', () => {
  let authToken: string;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = generateTestToken('test-admin-id');

    // Mock do usuário autenticado para o middleware
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-admin-id',
      name: 'Admin User',
      email: 'admin@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('Deve criar um novo usuário', async () => {
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'João',
      email: 'joao@example.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'João',
        email: 'joao@example.com',
        password: 'senha123',
      });

    expect(response.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(response.body.user.name).toBe('João');
    expect(response.body.user.email).toBe('joao@example.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('senha123', 10);
  });

  it('Deve listar usuários', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    (prisma.user.count as jest.Mock).mockResolvedValue(1);

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items[0].email).toBe('joao@example.com');
    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.count).toHaveBeenCalledTimes(1);
  });

  it('Deve buscar usuário por ID', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '2',
      name: 'Maria',
      email: 'maria@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app)
      .get('/api/users/2')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('maria@example.com');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: '2' } });
  });

  it('Deve atualizar um usuário', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: '3',
      name: 'Bob Updated',
      email: 'bob@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app)
      .put('/api/users/3')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bob Updated' });

    expect(response.status).toBe(200);
    expect(response.body.user.name).toBe('Bob Updated');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '3' },
      data: { name: 'Bob Updated' },
    });
  });

  it('Deve deletar um usuário', async () => {
    (prisma.user.delete as jest.Mock).mockResolvedValue({
      id: '4',
      name: 'Eve',
      email: 'eve@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app)
      .delete('/api/users/4')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Usuário deletado com sucesso');
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: '4' } });
  });

  describe('Login', () => {
    it('Deve fazer login com sucesso', async () => {
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      const mockUser = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashedPassword',
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(app).post('/api/users/login').send({
        email: 'joao@example.com',
        password: 'senha123',
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login realizado com sucesso');
      expect(response.body.user).toEqual({
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString(),
      });
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'joao@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('senha123', 'hashedPassword');
    });

    it('Deve retornar erro 401 para credenciais inválidas - usuário não encontrado', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).post('/api/users/login').send({
        email: 'inexistente@example.com',
        password: 'senha123',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Credenciais inválidas');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'inexistente@example.com' },
      });
    });

    it('Deve retornar erro 401 para credenciais inválidas - senha incorreta', async () => {
      const mockUser = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app).post('/api/users/login').send({
        email: 'joao@example.com',
        password: 'senhaIncorreta',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Credenciais inválidas');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'joao@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('senhaIncorreta', 'hashedPassword');
    });

    it('Deve retornar erro 400 para dados de validação inválidos', async () => {
      const response = await request(app).post('/api/users/login').send({
        email: 'email-invalido',
        password: '',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('Deve retornar erro 400 quando email não é fornecido', async () => {
      const response = await request(app).post('/api/users/login').send({
        password: 'senha123',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('Deve retornar erro 400 quando senha não é fornecida', async () => {
      const response = await request(app).post('/api/users/login').send({
        email: 'joao@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
