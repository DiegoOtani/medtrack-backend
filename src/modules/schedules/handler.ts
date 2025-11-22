import { Frequency, Prisma } from '@prisma/client';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/**
 * Time calculator helper function to add interval hours to the start time
 */
function timeCalculator(startTime: string, interval: number) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + interval * 60;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
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

  schedules.push(
    { time: _startTime, daysOfWeek: DAYS_OF_WEEK },
    { time: timeCalculator(_startTime, interval), daysOfWeek: DAYS_OF_WEEK }
  );

  return schedules;
}

/**
 * THREE TIMES A DAY SCHEDULE HANDLER
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

  schedules.push(
    { time: _startTime, daysOfWeek: DAYS_OF_WEEK },
    { time: timeCalculator(_startTime, interval), daysOfWeek: DAYS_OF_WEEK },
    { time: timeCalculator(_startTime, interval * 2), daysOfWeek: DAYS_OF_WEEK }
  );

  return schedules;
}

/**
 * FOUR TIMES A DAY SCHEDULE HANDLER
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

  schedules.push(
    { time: _startTime, daysOfWeek: DAYS_OF_WEEK },
    { time: timeCalculator(_startTime, interval), daysOfWeek: DAYS_OF_WEEK },
    {
      time: timeCalculator(_startTime, interval * 2),
      daysOfWeek: DAYS_OF_WEEK,
    },
    { time: timeCalculator(_startTime, interval * 3), daysOfWeek: DAYS_OF_WEEK }
  );

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
