import prisma from "../../shared/lib/prisma";
import { UserSchema, UserQuery, LoginSchema } from "./user.schema";
import bcrypt from "bcrypt";

export async function getUsers(query: UserQuery) {
  const { page, limit, orderBy = "createdAt", order = "asc", ...filters } = query;

  const where: any = {};
  if (filters.name) where.name = { contains: filters.name, mode: "insensitive" };
  if (filters.email) where.email = { contains: filters.email, mode: "insensitive" };

  const take = limit ?? undefined;
  const skip = page && limit ? (page - 1) * limit : undefined;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { [orderBy]: order },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    total,
    page: page ?? 1,
    limit: limit ?? total,
    items,
  };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: UserSchema) {
  const { password, ...userData } = data;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  return prisma.user.create({ 
    data: { 
      ...userData, 
      password: hashedPassword 
    } 
  });
}

export async function updateUser(id: string, data: Partial<UserSchema>) {
  const updateData: any = { ...data };
  
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }
  
  return prisma.user.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

export async function loginUser(data: LoginSchema) {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Credenciais inválidas");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Credenciais inválidas");
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
