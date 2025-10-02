import { z } from "zod";

export const UserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type UserSchema = z.infer<typeof UserSchema>;

export const UserQuery = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  orderBy: z.enum(["name", "email", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type UserQuery = z.infer<typeof UserQuery>;

export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginSchema = z.infer<typeof LoginSchema>;