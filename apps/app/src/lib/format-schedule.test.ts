import { describe, expect, it } from "vitest";
import { buildAutomationCron } from "./format-schedule";

describe("buildAutomationCron", () => {
  it.each([
    ["manual", "09:00", "0 9 * * *"],
    ["hourly", "09:00", "0 * * * *"],
    ["daily", "13:45", "45 13 * * *"],
    ["weekdays", "14:30", "30 14 * * 1-5"],
    ["weekly", "07:15", "15 7 * * 1"],
    ["custom", "09:00", "*/15 * * * *"],
  ] as const)("maps %s cadence to cron", (cadence, time, expected) => {
    expect(
      buildAutomationCron({
        cadence,
        time,
        customCron: "*/15 * * * *",
      }),
    ).toBe(expected);
  });
});
