import request from "supertest";
import app from "../../app";

jest.mock("../../shared/lib/prisma", () => ({
  medication: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
}));

import prisma from "../../shared/lib/prisma";

describe("Medication API (mocked)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Deve criar um novo medicamento", async () => {
    const mockDate = new Date("2024-12-31T23:59:59.000Z");
    (prisma.medication.create as jest.Mock).mockResolvedValue({
      id: "1",
      name: "Paracetamol",
      dosage: "500mg",
      frequency: "DAILY",
      expiresAt: mockDate,
      stock: 20,
      notes: null,
      userId: "550e8400-e29b-41d4-a716-446655440000",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app).post("/api/medications").send({
      name: "Paracetamol",
      dosage: "500mg",
      frequency: "DAILY",
      expiresAt: mockDate.toISOString(),
      stock: 20,
      notes: "Tomar com água",
    });

    expect(response.status).toBe(201);
    expect(prisma.medication.create).toHaveBeenCalledTimes(1);
    expect(response.body.medication.name).toBe("Paracetamol");
    expect(response.body.medication.frequency).toBe("DAILY");
  });

  it("Deve listar medicamentos", async () => {
    (prisma.medication.findMany as jest.Mock).mockResolvedValue([
      {
        id: "1",
        name: "Ibuprofeno",
        dosage: "400mg",
        frequency: "DAILY",
        expiresAt: new Date(),
        stock: 10,
        notes: null,
        userId: "550e8400-e29b-41d4-a716-446655440000",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  
    (prisma.medication.count as jest.Mock).mockResolvedValue(1);
  
    const response = await request(app).get("/api/medications");
  
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items[0].name).toBe("Ibuprofeno");
    expect(prisma.medication.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.medication.count).toHaveBeenCalledTimes(1);
  });
  
  it("Deve buscar medicamento por ID", async () => {
    (prisma.medication.findUnique as jest.Mock).mockResolvedValue({
      id: "2",
      name: "Dipirona",
      dosage: "1g",
      frequency: "DAILY",
      expiresAt: new Date(),
      stock: 5,
      notes: null,
      userId: "550e8400-e29b-41d4-a716-446655440000",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app).get("/api/medications/2");

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Dipirona");
    expect(prisma.medication.findUnique).toHaveBeenCalledWith({ where: { id: "2" } });
  });

  it("Deve atualizar um medicamento", async () => {
    (prisma.medication.update as jest.Mock).mockResolvedValue({
      id: "3",
      name: "Amoxicilina",
      dosage: "250mg",
      frequency: "DAILY",
      expiresAt: new Date(),
      stock: 15,
      notes: null,
      userId: "550e8400-e29b-41d4-a716-446655440000",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app)
      .put("/api/medications/3")
      .send({ stock: 15 });

    expect(response.status).toBe(200);
    expect(response.body.medication.stock).toBe(15);
    expect(prisma.medication.update).toHaveBeenCalledWith({
      where: { id: "3" },
      data: { stock: 15 },
    });
  });

  it("Deve deletar um medicamento", async () => {
    (prisma.medication.delete as jest.Mock).mockResolvedValue({
      id: "4",
      name: "Cetirizina",
      dosage: "10mg",
      frequency: "DAILY",
      expiresAt: new Date(),
      stock: 30,
      notes: null,
      userId: "550e8400-e29b-41d4-a716-446655440000",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app).delete("/api/medications/4");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Medicamento deletado com sucesso");
    expect(prisma.medication.delete).toHaveBeenCalledWith({ where: { id: "4" } });
  });
});
