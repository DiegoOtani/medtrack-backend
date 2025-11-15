import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../../shared/lib/prisma';

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * Gera hash da senha
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verifica se a senha está correta
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Gera token JWT
   */
  generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Verifica e decodifica token JWT
   */
  verifyToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string; email: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Registra um novo usuário
   */
  async register(email: string, password: string, name: string) {
    // Verifica se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Usuário já existe com este email');
    }

    // Hash da senha
    const hashedPassword = await this.hashPassword(password);

    // Cria usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Gera token
    const token = this.generateToken(user.id, user.email);

    // Retorna usuário sem senha e token
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Faz login do usuário
   */
  async login(email: string, password: string) {
    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verifica senha
    const isPasswordValid = await this.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    // Gera token
    const token = this.generateToken(user.id, user.email);

    // Retorna usuário sem senha e token
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Busca usuário por ID (para middleware)
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
