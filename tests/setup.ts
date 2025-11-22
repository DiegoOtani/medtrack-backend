import { PrismaClient } from '@prisma/client';

// Mock do Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
  Frequency: {
    ONE_TIME: 'ONE_TIME',
    DAILY: 'DAILY',
    TWICE_A_DAY: 'TWICE_A_DAY',
    THREE_TIMES_A_DAY: 'THREE_TIMES_A_DAY',
    FOUR_TIMES_A_DAY: 'FOUR_TIMES_A_DAY',
    EVERY_OTHER_DAY: 'EVERY_OTHER_DAY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    AS_NEEDED: 'AS_NEEDED',
    CUSTOM: 'CUSTOM',
  },
  HistoryAction: {
    TAKEN: 'TAKEN',
    SKIPPED: 'SKIPPED',
    MISSED: 'MISSED',
    POSTPONED: 'POSTPONED',
    EXPIRED: 'EXPIRED',
    RESTOCKED: 'RESTOCKED',
    DISCARDED: 'DISCARDED',
  },
}));

// Timeout maior para testes de integração
jest.setTimeout(10000);

// Limpar todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});
