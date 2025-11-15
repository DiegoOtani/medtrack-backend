import prisma from "../../shared/lib/prisma";
import { MedicationSchema, MedicationQuery } from "./medication.schemas";

export async function getMedications(query: MedicationQuery) {
  const { page, limit, ...filters } = query;

  const where: any = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.name) where.name = { contains: filters.name, mode: "insensitive" };
  if (filters.dosage) where.dosage = { contains: filters.dosage, mode: "insensitive" };
  if (filters.frequency) where.frequency = filters.frequency;
  if (filters.expiresAt) where.expiresAt = filters.expiresAt;
  if (filters.stock !== undefined) where.stock = filters.stock;

  const take = limit ?? undefined;
  const skip = page && limit ? (page - 1) * limit : undefined;

  const [items, total] = await Promise.all([
    prisma.medication.findMany({
      where,
      skip,
      take,
    }),
    prisma.medication.count({ where }),
  ]);

  return {
    total,
    page: page ?? 1,
    limit: limit ?? total,
    items,
  };
}
export async function getMedicationsById(id: string) {
  return prisma.medication.findUnique({ where: { id } })
};

export async function createMedication(data: MedicationSchema) {
  return prisma.medication.create({ data });
};

export async function updateMedication(id: string, data: Partial<MedicationSchema>) {
  return prisma.medication.update({
    where: { id },
    data,
  });
};

export async function deleteMedication(id: string) {
  return prisma.medication.delete({ where: { id } })
};