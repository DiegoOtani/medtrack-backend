import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as userService from './user.service';
import { UserSchema, UserQuery, LoginSchema, RegisterSchema } from './user.schema';
import { ZodError } from 'zod';
import { AuthService } from '../../shared/services/auth.service';

/**
 * Handles the request to get a paginated list of users with optional filters.
 *
 * @param {RequestHandler} req - Express request object containing query parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with users and pagination info
 *
 * @throws {500} When an internal server error occurs
 *
 * Expected query parameters:
 * - page: number (optional, page number)
 * - limit: number (optional, items per page)
 * - name: string (optional, filter by name)
 * - email: string (optional, filter by email)
 *
 * Example:
 * ```http
 * GET /users?page=1&limit=10&name=joão
 * ```
 */
export const getUsersHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const query = UserQuery.parse(req.query);
    const result = await userService.getUsers(query);
    res.json(result);
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({
      error: error.message || 'Erro ao buscar usuários',
    });
  }
};

/**
 * Handles the request to get a specific user by their ID.
 *
 * @param {RequestHandler} req - Express request object containing the user ID
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with the user
 *
 * @throws {404} When the user is not found
 * @throws {500} When an internal server error occurs
 */
export const getUserByIdHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Erro ao buscar usuário',
    });
  }
};

/**
 * Handles the request to create a new user.
 *
 * @param {RequestHandler} req - Express request object containing the user data
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with the created user
 *
 * @throws {400} When validation fails or user cannot be created
 *
 * Expected request body:
 * - name: string (required)
 * - email: string (required, unique)
 */
export const createUserHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = UserSchema.parse(req.body);
    const user = await userService.createUser(data);
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.errors || error.message || 'Erro ao criar usuário',
    });
  }
};

/**
 * Handles the request to update an existing user by ID.
 *
 * @param {RequestHandler} req - Express request object containing the user ID and update data
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with the updated user
 *
 * @throws {400} When validation fails or update cannot be applied
 *
 * Expected request body:
 * - Any subset of: name, email
 */
export const updateUserHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = UserSchema.partial().parse(req.body);

    const user = await userService.updateUser(id, data);
    res.json({
      message: 'Usuário atualizado com sucesso',
      user,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.errors || error.message || 'Erro ao atualizar usuário',
    });
  }
};

/**
 * Handles the request to delete a user by ID.
 *
 * @param {RequestHandler} req - Express request object containing the user ID
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response confirming deletion
 *
 * @throws {400} When the user cannot be deleted
 */
export const deleteUserHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Erro ao deletar usuário',
    });
  }
};

/**
 * Handles the request to get the current authenticated user.
 *
 * @param {RequestHandler} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with the current user
 *
 * @throws {401} When user is not authenticated
 * @throws {404} When the user is not found
 */
export const getCurrentUserHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Remover senha da resposta
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Erro ao buscar usuário atual',
    });
  }
};

/**
 * Handles the request to authenticate a user (login).
 *
 * @param {RequestHandler} req - Express request object containing login credentials
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with the authenticated user
 *
 * @throws {400} When validation fails or credentials are invalid
 * @throws {500} When an internal server error occurs
 *
 * Expected request body:
 * - email: string (required, valid email)
 * - password: string (required)
 */
export const loginUserHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = LoginSchema.parse(req.body);
    const user = await userService.loginUser(data);

    res.json({
      message: 'Login realizado com sucesso',
      user,
    });
  } catch (error: any) {
    if (error.message === 'Credenciais inválidas') {
      return res.status(401).json({
        error: 'Credenciais inválidas',
      });
    }
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.errors || error.message || 'Erro ao fazer login',
    });
  }
};

/**
 * Handles user registration with JWT token generation
 */
export const registerHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const authService = new AuthService();

    const result = await authService.register(data.email, data.password, data.name);

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    if (error.message === 'Usuário já existe com este email') {
      return res.status(409).json({
        error: 'Usuário já existe com este email',
      });
    }
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.message || 'Erro ao registrar usuário',
    });
  }
};

/**
 * Handles user login with JWT token generation
 */
export const loginHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = LoginSchema.parse(req.body);
    const authService = new AuthService();

    const result = await authService.login(data.email, data.password);

    res.json({
      message: 'Login realizado com sucesso',
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    if (error.message === 'Credenciais inválidas') {
      return res.status(401).json({
        error: 'Credenciais inválidas',
      });
    }
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.message || 'Erro ao fazer login',
    });
  }
};
