import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário de teste
  const hashedPassword = await bcrypt.hash('senha123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'teste@medtrack.com' },
    update: {},
    create: {
      name: 'Usuário Teste',
      email: 'teste@medtrack.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Usuário criado:', user.email);

  // Criar alguns medicamentos de exemplo
  const paracetamol = await prisma.medication.upsert({
    where: { id: 'med-paracetamol' },
    update: {},
    create: {
      id: 'med-paracetamol',
      name: 'Paracetamol',
      dosage: '500mg',
      frequency: 'THREE_TIMES_A_DAY', // 3x ao dia
      expiresAt: new Date('2026-12-31'),
      stock: 20,
      userId: user.id,
      startTime: '08:00',
      intervalHours: 8, // a cada 8 horas
    },
  });

  const ibuprofeno = await prisma.medication.upsert({
    where: { id: 'med-ibuprofeno' },
    update: {},
    create: {
      id: 'med-ibuprofeno',
      name: 'Ibuprofeno',
      dosage: '200mg',
      frequency: 'TWICE_A_DAY', // 2x ao dia
      expiresAt: new Date('2026-06-30'),
      stock: 15,
      userId: user.id,
      startTime: '08:00',
      intervalHours: 12, // a cada 12 horas
    },
  });

  console.log('✅ Medicamentos criados');

  // Criar agendamentos para hoje
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedules = [
    {
      id: 'sched-paracetamol-08',
      medicationId: paracetamol.id,
      time: '08:00',
      daysOfWeek: ['1', '2', '3', '4', '5', '6', '7'], // todos os dias como strings
      isActive: true,
    },
    {
      id: 'sched-paracetamol-16',
      medicationId: paracetamol.id,
      time: '16:00',
      daysOfWeek: ['1', '2', '3', '4', '5', '6', '7'],
      isActive: true,
    },
    {
      id: 'sched-ibuprofeno-12',
      medicationId: ibuprofeno.id,
      time: '12:00',
      daysOfWeek: ['1', '2', '3', '4', '5', '6', '7'],
      isActive: true,
    },
  ];

  for (const schedule of schedules) {
    await prisma.medicationSchedule.upsert({
      where: { id: schedule.id },
      update: {},
      create: schedule,
    });
  }

  console.log('✅ Agendamentos criados');

  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📋 Dados de teste criados:');
  console.log('   Email: teste@medtrack.com');
  console.log('   Senha: senha123');
  console.log('   Medicamentos: Paracetamol (8h e 16h), Ibuprofeno (12h)');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
