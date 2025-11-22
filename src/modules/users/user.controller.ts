import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as userService from './user.service';
import { UserSchema, UserQuery, LoginSchema, RegisterSchema } from './user.schema';
import { ZodError } from 'zod';
import bcrypt from 'bcrypt';
import { generateToken } from '../../shared/utils/jwt';

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Lista paginada de usuários com filtros opcionais
 *     description: |
 *       Retorna uma lista paginada de usuários com suporte a filtros por nome e email.
 *       Permite ordenação por nome, email ou data de criação em ordem crescente ou decrescente.
 *       **Requer autenticação**: Este endpoint requer um token JWT válido no header Authorization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Número da página para paginação
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           description: Quantidade de itens por página
 *           example: 10
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           description: Filtrar usuários por nome (case insensitive, busca parcial)
 *           example: "João"
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           description: Filtrar usuários por email (case insensitive, busca parcial)
 *           example: "joao@email.com"
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [name, email, createdAt]
 *           default: createdAt
 *           description: Campo para ordenação dos resultados
 *           example: "name"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *           description: Ordem de classificação (ascendente ou descendente)
 *           example: "asc"
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPaginatedResponse'
 *             example:
 *               total: 25
 *               page: 1
 *               limit: 10
 *               items:
 *                 - id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "João Silva"
 *                   email: "joao.silva@email.com"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-20T14:45:00.000Z"
 *                   timeZone: "America/Sao_Paulo"
 *       401:
 *         description: Token de acesso não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 value:
 *                   error: "Token de acesso necessário"
 *               invalidToken:
 *                 value:
 *                   error: "Token inválido"
 *       400:
 *         description: Erro de validação dos parâmetros
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               success: false
 *               error: "Erro de validação"
 *               details:
 *                 - field: "page"
 *                   message: "Expected number, received string"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Erro ao buscar usuários"
 */

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
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    res.status(500).json({
      error: error.message || 'Erro ao buscar usuários',
    });
  }
};

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Busca um usuário pelo ID
 *     description: |
 *       Retorna os detalhes completos de um usuário específico pelo seu ID único.
 *       **Requer autenticação**: Este endpoint requer um token JWT válido no header Authorization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: ID único do usuário (UUID)
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Usuário encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             example:
 *               id: "550e8400-e29b-41d4-a716-446655440000"
 *               name: "João Silva"
 *               email: "joao.silva@email.com"
 *               createdAt: "2024-01-15T10:30:00.000Z"
 *               updatedAt: "2024-01-20T14:45:00.000Z"
 *               timeZone: "America/Sao_Paulo"
 *       401:
 *         description: Token de acesso não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 value:
 *                   error: "Token de acesso necessário"
 *               invalidToken:
 *                 value:
 *                   error: "Token inválido"
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Usuário não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Erro ao buscar usuário"
 */

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
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Cria um novo usuário
 *     description: |
 *       Cria um novo usuário no sistema com senha hasheada.
 *       O email deve ser único no sistema.
 *       A senha é automaticamente hasheada antes de ser armazenada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *           example:
 *             name: "João Silva"
 *             email: "joao.silva@email.com"
 *             password: "minhaSenha123"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuário criado com sucesso"
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *             example:
 *               message: "Usuário criado com sucesso"
 *               user:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "João Silva"
 *                 email: "joao.silva@email.com"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *                 timeZone: "America/Sao_Paulo"
 *       400:
 *         description: Erro de validação ou email já existe
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validationError:
 *                 value:
 *                   success: false
 *                   error: "Erro de validação"
 *                   details:
 *                     - field: "email"
 *                       message: "Email inválido"
 *               duplicateEmail:
 *                 value:
 *                   error: "Email já está em uso"
 */

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
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    res.status(400).json({
      error: error.errors || error.message || 'Erro ao criar usuário',
    });
  }
};

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Atualiza um usuário existente
 *     description: |
 *       Atualiza parcialmente os dados de um usuário existente.
 *       Todos os campos são opcionais. Se a senha for fornecida, ela será hasheada automaticamente.
 *       O email, se fornecido, deve ser único no sistema.
 *       **Requer autenticação**: Este endpoint requer um token JWT válido no header Authorization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: ID único do usuário a ser atualizado
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *           examples:
 *             updateName:
 *               value:
 *                 name: "João Silva Santos"
 *             updateEmail:
 *               value:
 *                 email: "novo.email@email.com"
 *             updatePassword:
 *               value:
 *                 password: "novaSenhaSegura123"
 *             updateMultiple:
 *               value:
 *                 name: "João S. Santos"
 *                 email: "joao.santos@email.com"
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuário atualizado com sucesso"
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *             example:
 *               message: "Usuário atualizado com sucesso"
 *               user:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "João Silva Santos"
 *                 email: "joao.santos@email.com"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-20T15:30:00.000Z"
 *                 timeZone: "America/Sao_Paulo"
 *       401:
 *         description: Token de acesso não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 value:
 *                   error: "Token de acesso necessário"
 *               invalidToken:
 *                 value:
 *                   error: "Token inválido"
 *       400:
 *         description: Erro de validação, email duplicado ou erro ao atualizar
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validationError:
 *                 value:
 *                   success: false
 *                   error: "Erro de validação"
 *                   details:
 *                     - field: "email"
 *                       message: "Email inválido"
 *               duplicateEmail:
 *                 value:
 *                   error: "Email já está em uso"
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Usuário não encontrado"
 */

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
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    res.status(400).json({
      error: error.errors || error.message || 'Erro ao atualizar usuário',
    });
  }
};

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Deleta um usuário pelo ID
 *     description: |
 *       Remove permanentemente um usuário do sistema.
 *       **Atenção**: Esta operação é irreversível e também removerá
 *       todos os dados relacionados ao usuário (medicações, histórico, etc.).
 *       **Requer autenticação**: Este endpoint requer um token JWT válido no header Authorization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: ID único do usuário a ser deletado
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuário deletado com sucesso"
 *             example:
 *               message: "Usuário deletado com sucesso"
 *       401:
 *         description: Token de acesso não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 value:
 *                   error: "Token de acesso necessário"
 *               invalidToken:
 *                 value:
 *                   error: "Token inválido"
 *       400:
 *         description: Erro ao deletar usuário (usuário não existe ou tem dependências)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               userNotFound:
 *                 value:
 *                   error: "Erro ao deletar usuário"
 *               hasDependencies:
 *                 value:
 *                   error: "Não é possível deletar usuário com medicações ativas"
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Usuário não encontrado"
 */
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
/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Busca dados do usuário autenticado
 *     description: |
 *       Retorna os dados completos do usuário atualmente autenticado.
 *       Útil para sincronizar dados do usuário no frontend após login ou ao recarregar o app.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             example:
 *               id: "550e8400-e29b-41d4-a716-446655440000"
 *               name: "João Silva"
 *               email: "joao.silva@email.com"
 *               createdAt: "2024-01-15T10:30:00.000Z"
 *               updatedAt: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Usuário não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Usuário não autenticado"
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Usuário não encontrado"
 *       500:
 *         description: Erro interno do servidor
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
 * @openapi
 * /api/users/login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Autentica um usuário (login)
 *     description: |
 *       Autentica um usuário usando email e senha.
 *       Retorna os dados do usuário (sem a senha) e um token JWT para autenticação em requisições futuras.
 *       O token JWT deve ser incluído no header Authorization: Bearer {token} das requisições protegidas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *           example:
 *             email: "joao.silva@email.com"
 *             password: "minhaSenha123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               message: "Login realizado com sucesso"
 *               user:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "João Silva"
 *                 email: "joao.silva@email.com"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-20T14:45:00.000Z"
 *                 timeZone: "America/Sao_Paulo"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImpvYW8uc2lsdmFAZW1haWwuY29tIiwiaWF0IjoxNzA1MzI1NDAwLCJleHAiOjE3MDU0MTE4MDB9..."
 *       400:
 *         description: Erro de validação dos dados de entrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               success: false
 *               error: "Erro de validação"
 *               details:
 *                 - field: "email"
 *                   message: "Email inválido"
 *                 - field: "password"
 *                   message: "Senha é obrigatória"
 *       401:
 *         description: Credenciais inválidas (email ou senha incorretos)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Credenciais inválidas"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Erro ao fazer login"
 */

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
    const result = await userService.loginUser(data);

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
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    res.status(400).json({
      error: error.errors || error.message || 'Erro ao fazer login',
    });
  }
};

/**
 * @openapi
 * /api/users/register:
 *   post:
 *     tags:
 *       - Users
 *     summary: Registra um novo usuário
 *     description: |
 *       Cria uma nova conta de usuário no sistema.
 *       Retorna os dados do usuário criado (sem a senha) e um token JWT para autenticação automática.
 *       **Rate Limit:** 5 requisições por 15 minutos para prevenir abuso.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nome completo do usuário
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email único do usuário
 *                 example: "joao.silva@email.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Senha do usuário (será hasheada)
 *                 example: "senha123"
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuário registrado com sucesso"
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticação
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             example:
 *               message: "Usuário registrado com sucesso"
 *               user:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "João Silva"
 *                 email: "joao.silva@email.com"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               invalidData:
 *                 value:
 *                   error: "Email inválido"
 *               shortPassword:
 *                 value:
 *                   error: "Senha deve ter no mínimo 6 caracteres"
 *       409:
 *         description: Email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Usuário já existe com este email"
 *       429:
 *         description: Rate limit excedido
 */
export const registerHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = RegisterSchema.parse(req.body);

    // Verificar se usuário já existe
    const existingUser = await userService.getUserByEmail(data.email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Usuário já existe com este email',
      });
    }

    // Criar usuário com senha hasheada
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await userService.createUser({
      ...data,
      password: hashedPassword,
    });

    // Gerar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.message || 'Erro ao registrar usuário',
    });
  }
};

/**
 * @openapi
 * /api/users/login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Autentica um usuário (login)
 *     description: |
 *       Realiza login de usuário existente usando email e senha.
 *       Retorna os dados do usuário (sem a senha) e um token JWT válido por 7 dias.
 *       O token deve ser incluído no header `Authorization: Bearer {token}` em requisições protegidas.
 *       **Rate Limit:** 5 requisições por 15 minutos para prevenir ataques de força bruta.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *                 example: "joao.silva@email.com"
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *                 example: "senha123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login realizado com sucesso"
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticação (válido por 7 dias)
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             example:
 *               message: "Login realizado com sucesso"
 *               user:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "João Silva"
 *                 email: "joao.silva@email.com"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               invalidEmail:
 *                 value:
 *                   error: "Email inválido"
 *               missingPassword:
 *                 value:
 *                   error: "Senha é obrigatória"
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Credenciais inválidas"
 *       429:
 *         description: Rate limit excedido (muitas tentativas de login)
 */
export const loginHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = LoginSchema.parse(req.body);
    const result = await userService.loginUser(data);

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
