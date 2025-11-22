import { Frequency, Prisma } from '@prisma/client';
import { addHours, format, differenceInDays, startOfDay } from 'date-fns';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/**
 * Helper to get next day of week
 */
function getNextDay(day: string): string {
  const index = DAYS_OF_WEEK.indexOf(day);
  return DAYS_OF_WEEK[(index + 1) % 7];
}

/**
 * Helper to get next N days from a day
 */
function getNextDays(startDay: string, offset: number): string {
  const index = DAYS_OF_WEEK.indexOf(startDay);
  return DAYS_OF_WEEK[(index + offset) % 7];
}

/**
 * Time calculator helper function to add interval hours to the start time
 * Returns the new time and day offset (0 = same day, 1 = next day, etc.)
 *
 * Refatorado com date-fns para melhor legibilidade e menos bugs
 */
function timeCalculator(
  startTime: string,
  intervalHours: number
): { time: string; dayOffset: number } {
  // Parsear horário de início (usa data base arbitrária)
  const [hours, minutes] = startTime.split(':').map(Number);
  const baseDate = new Date(2000, 0, 1); // 01/01/2000 00:00
  const start = new Date(2000, 0, 1, hours, minutes, 0, 0);

  // Adicionar intervalo de horas
  const next = addHours(start, intervalHours);

  // Calcular quantos dias passaram (0 = mesmo dia, 1 = próximo dia, etc.)
  const dayOffset = differenceInDays(startOfDay(next), startOfDay(baseDate));

  return {
    time: format(next, 'HH:mm'),
    dayOffset,
  };
}

/**
 * ONCE A DAY SCHEDULE HANDLER
 */
function onceADaySchedule(
  startTime: Prisma.MedicationCreateArgs['data']['startTime'],
  intervalHours: Prisma.MedicationCreateArgs['data']['intervalHours']
): Array<{
  time: Prisma.MedicationScheduleCreateInput['time'];
  daysOfWeek: Prisma.MedicationScheduleCreateInput['daysOfWeek'];
}> {
  const schedules = [];
  const _startTime = startTime || '08:00';

  schedules.push({
    time: _startTime,
    daysOfWeek: DAYS_OF_WEEK,
  });

  return schedules;
}

/**
 * TWICE A DAY SCHEDULE HANDLER
 * Cria schedules considerando que doses podem ser no dia seguinte
 */
function twiceADaySchedule(
  startTime: Prisma.MedicationCreateArgs['data']['startTime'],
  intervalHours: Prisma.MedicationCreateArgs['data']['intervalHours']
): Array<{
  time: Prisma.MedicationScheduleCreateInput['time'];
  daysOfWeek: Prisma.MedicationScheduleCreateInput['daysOfWeek'];
}> {
  const schedules = [];
  const interval = intervalHours || 12;
  const _startTime = startTime || '08:00';

  const schedule2 = timeCalculator(_startTime, interval);

  // Para cada dia da semana, criar schedules ajustados
  for (const day of DAYS_OF_WEEK) {
    schedules.push({
      time: _startTime,
      daysOfWeek: [day],
    });

    const day2 = schedule2.dayOffset > 0 ? getNextDays(day, schedule2.dayOffset) : day;
    schedules.push({
      time: schedule2.time,
      daysOfWeek: [day2],
    });
  }

  return schedules;
}

/**
 * THREE TIMES A DAY SCHEDULE HANDLER
 * Cria schedules considerando que doses podem ser no dia seguinte
 */
function threeTimesADaySchedule(
  startTime: Prisma.MedicationCreateArgs['data']['startTime'],
  intervalHours: Prisma.MedicationCreateArgs['data']['intervalHours']
): Array<{
  time: Prisma.MedicationScheduleCreateInput['time'];
  daysOfWeek: Prisma.MedicationScheduleCreateInput['daysOfWeek'];
}> {
  const schedules = [];
  const interval = intervalHours || 8;
  const _startTime = startTime || '08:00';

  const schedule2 = timeCalculator(_startTime, interval);
  const schedule3 = timeCalculator(_startTime, interval * 2);

  // Para cada dia da semana, criar schedules ajustados
  for (const day of DAYS_OF_WEEK) {
    schedules.push({
      time: _startTime,
      daysOfWeek: [day],
    });

    const day2 = schedule2.dayOffset > 0 ? getNextDays(day, schedule2.dayOffset) : day;
    schedules.push({
      time: schedule2.time,
      daysOfWeek: [day2],
    });

    const day3 = schedule3.dayOffset > 0 ? getNextDays(day, schedule3.dayOffset) : day;
    schedules.push({
      time: schedule3.time,
      daysOfWeek: [day3],
    });
  }

  return schedules;
}

/**
 * FOUR TIMES A DAY SCHEDULE HANDLER
 * Cria schedules considerando que doses podem ser no dia seguinte
 */
function fourTimesADaySchedule(
  startTime: Prisma.MedicationCreateArgs['data']['startTime'],
  intervalHours: Prisma.MedicationCreateArgs['data']['intervalHours']
): Array<{
  time: Prisma.MedicationScheduleCreateInput['time'];
  daysOfWeek: Prisma.MedicationScheduleCreateInput['daysOfWeek'];
}> {
  const schedules = [];
  const interval = intervalHours || 6;
  const _startTime = startTime || '08:00';

  const schedule2 = timeCalculator(_startTime, interval);
  const schedule3 = timeCalculator(_startTime, interval * 2);
  const schedule4 = timeCalculator(_startTime, interval * 3);

  // Para cada dia da semana, criar schedules ajustados
  for (const day of DAYS_OF_WEEK) {
    // Schedule 1 - sempre no mesmo dia
    schedules.push({
      time: _startTime,
      daysOfWeek: [day],
    });

    // Schedule 2 - pode ser dia seguinte
    const day2 = schedule2.dayOffset > 0 ? getNextDays(day, schedule2.dayOffset) : day;
    schedules.push({
      time: schedule2.time,
      daysOfWeek: [day2],
    });

    // Schedule 3 - pode ser dia seguinte
    const day3 = schedule3.dayOffset > 0 ? getNextDays(day, schedule3.dayOffset) : day;
    schedules.push({
      time: schedule3.time,
      daysOfWeek: [day3],
    });

    // Schedule 4 - pode ser dia seguinte
    const day4 = schedule4.dayOffset > 0 ? getNextDays(day, schedule4.dayOffset) : day;
    schedules.push({
      time: schedule4.time,
      daysOfWeek: [day4],
    });
  }

  return schedules;
}

/**
 * EVERY OTHER DAY SCHEDULE HANDLER
 */
function everyOtherDaySchedule(
  startTime: Prisma.MedicationCreateArgs['data']['startTime'],
  intervalHours: Prisma.MedicationCreateArgs['data']['intervalHours']
): Array<{
  time: Prisma.MedicationScheduleCreateInput['time'];
  daysOfWeek: Prisma.MedicationScheduleCreateInput['daysOfWeek'];
}> {
  const schedules = [];
  const _startTime = startTime || '08:00';
  const alternateDays = ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SUNDAY'];

  schedules.push({
    time: _startTime,
    daysOfWeek: alternateDays,
  });

  return schedules;
}

/**
 * WEEKLY SCHEDULE HANDLER
 */
function weeklySchedule(
  startTime: Prisma.MedicationCreateArgs['data']['startTime'],
  intervalHours: Prisma.MedicationCreateArgs['data']['intervalHours']
): Array<{
  time: Prisma.MedicationScheduleCreateInput['time'];
  daysOfWeek: Prisma.MedicationScheduleCreateInput['daysOfWeek'];
}> {
  const schedules = [];
  const _startTime = startTime || '08:00';

  schedules.push({
    time: _startTime,
    daysOfWeek: ['MONDAY'], // Default to Monday for weekly
  });

  return schedules;
}

/**
 * MONTHLY SCHEDULE HANDLER
 */
function monthlySchedule(
  startTime: Prisma.MedicationCreateArgs['data']['startTime'],
  intervalHours: Prisma.MedicationCreateArgs['data']['intervalHours']
): Array<{
  time: Prisma.MedicationScheduleCreateInput['time'];
  daysOfWeek: Prisma.MedicationScheduleCreateInput['daysOfWeek'];
}> {
  const schedules = [];
  const _startTime = startTime || '08:00';

  schedules.push({
    time: _startTime,
    daysOfWeek: ['MONDAY'], // Default to Monday for monthly
  });

  return schedules;
}

/**
 * AS NEEDED SCHEDULE HANDLER
 */
function asNeededSchedule(
  startTime: Prisma.MedicationCreateArgs['data']['startTime'],
  intervalHours: Prisma.MedicationCreateArgs['data']['intervalHours']
): Array<{
  time: Prisma.MedicationScheduleCreateInput['time'];
  daysOfWeek: Prisma.MedicationScheduleCreateInput['daysOfWeek'];
}> {
  return [];
}

const scheduleHandlers: {
  [key in Frequency]: (
    startTime: Prisma.MedicationCreateArgs['data']['startTime'],
    intervalHours: Prisma.MedicationCreateArgs['data']['intervalHours']
  ) => Array<{
    time: Prisma.MedicationScheduleCreateInput['time'];
    daysOfWeek: Prisma.MedicationScheduleCreateInput['daysOfWeek'];
  }>;
} = {
  ONE_TIME: onceADaySchedule,
  DAILY: onceADaySchedule,
  TWICE_A_DAY: twiceADaySchedule,
  THREE_TIMES_A_DAY: threeTimesADaySchedule,
  FOUR_TIMES_A_DAY: fourTimesADaySchedule,
  EVERY_OTHER_DAY: everyOtherDaySchedule,
  WEEKLY: weeklySchedule,
  MONTHLY: monthlySchedule,
  AS_NEEDED: asNeededSchedule,
  CUSTOM: asNeededSchedule,
};

export default scheduleHandlers;
