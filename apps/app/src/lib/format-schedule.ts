import { toString as cronstrueToString } from "cronstrue";

export const automationScheduleCadenceValues = [
  "manual",
  "hourly",
  "daily",
  "weekdays",
  "weekly",
  "custom",
] as const;
export type AutomationScheduleCadence =
  (typeof automationScheduleCadenceValues)[number];

const DEFAULT_SCHEDULE_TIME = "09:00";

const SCHEDULE_RUN_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export interface FormatScheduleStatusLabelArgs {
  enabled: boolean;
  nextRunAt: number | null;
}

export interface AutomationScheduleParts {
  cadence: AutomationScheduleCadence;
  time: string;
  customCron: string;
}

export function cadenceUsesTime(cadence: AutomationScheduleCadence): boolean {
  return cadence === "daily" || cadence === "weekdays" || cadence === "weekly";
}

export function validateScheduleTime(time: string): string | null {
  const match = /^(\d{2}):(\d{2})$/u.exec(time);
  if (!match) {
    return "Use HH:MM time.";
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return "Use a valid 24-hour time.";
  }
  return null;
}

function parseScheduleTime(time: string): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/u.exec(time);
  if (!match) {
    return { hour: 9, minute: 0 };
  }
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

export function buildAutomationCron({
  cadence,
  customCron,
  time,
}: AutomationScheduleParts): string {
  if (cadence === "custom") {
    return customCron.trim();
  }
  if (cadence === "hourly") {
    return "0 * * * *";
  }
  const { hour, minute } = parseScheduleTime(time || DEFAULT_SCHEDULE_TIME);
  switch (cadence) {
    case "manual":
    case "daily":
      return `${minute} ${hour} * * *`;
    case "weekdays":
      return `${minute} ${hour} * * 1-5`;
    case "weekly":
      return `${minute} ${hour} * * 1`;
    default: {
      const _exhaustive: never = cadence;
      return _exhaustive;
    }
  }
}

/**
 * Human-readable recurrence for a cron expression, e.g.
 * "At 09:00 AM, Monday through Friday". Falls back to a neutral label rather
 * than surfacing the raw cron string when the expression can't be parsed.
 */
export function formatCronCadence(cron: string): string {
  try {
    return cronstrueToString(cron, { verbose: false });
  } catch {
    return "Custom schedule";
  }
}

/** Compact absolute time for an upcoming run, e.g. "Jun 6, 9:00 AM". */
export function formatScheduleRunTime(timestamp: number): string {
  return SCHEDULE_RUN_FORMATTER.format(new Date(timestamp));
}

/**
 * Right-aligned status text for an automation row: the next scheduled run when
 * enabled and scheduled, otherwise a neutral "Paused"/"Not scheduled" label.
 */
export function formatScheduleStatusLabel({
  enabled,
  nextRunAt,
}: FormatScheduleStatusLabelArgs): string {
  if (!enabled) {
    return "Paused";
  }
  if (nextRunAt === null) {
    return "Not scheduled";
  }
  return `Next ${formatScheduleRunTime(nextRunAt)}`;
}
