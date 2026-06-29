import type { IconName } from "@/components/ui/icon.js";

export type AutomationStarterLoopCategory =
  | "Maintenance"
  | "Digests"
  | "Monitoring"
  | "Releases";

export interface AutomationStarterLoop {
  name: string;
  icon: IconName;
  category: AutomationStarterLoopCategory;
  description: string;
  schedule: string;
  prompt: string;
}

export const AUTOMATION_TEMPLATE_CATEGORIES: readonly AutomationStarterLoopCategory[] =
  ["Maintenance", "Digests", "Monitoring", "Releases"];

export const AUTOMATION_STARTER_LOOPS = [
  {
    name: "Daily dependency audit",
    icon: "Search",
    category: "Maintenance",
    description: "Audit dependencies and write a summary.",
    schedule: "Daily 8am",
    prompt:
      "Create a new bb loop to audit dependencies every morning and write a summary.",
  },
  {
    name: "Weekday standup digest",
    icon: "MessageSquare",
    category: "Digests",
    description: "Summarize overnight thread activity.",
    schedule: "Weekdays 9am",
    prompt:
      "Create a new bb loop to summarize overnight thread activity on weekday mornings.",
  },
  {
    name: "Scheduled check & alert",
    icon: "AlertCircle",
    category: "Monitoring",
    description: "Run a check on a schedule and alert on change.",
    schedule: "Hourly",
    prompt:
      "Create a new bb loop to run a check on a schedule and alert me when something changes.",
  },
  {
    name: "Morning triage",
    icon: "ListTodo",
    category: "Digests",
    description: "Surface and prioritize overnight activity.",
    schedule: "Weekdays 8am",
    prompt:
      "Create a new bb loop to surface and prioritize overnight activity each weekday morning.",
  },
  {
    name: "Release notes draft",
    icon: "FileText",
    category: "Releases",
    description: "Draft release notes from recent changes.",
    schedule: "Fridays 5pm",
    prompt:
      "Create a new bb loop to draft release notes from recent changes every Friday afternoon.",
  },
  {
    name: "Stale work sweep",
    icon: "Archive",
    category: "Maintenance",
    description: "Flag threads and branches gone quiet.",
    schedule: "Weekly",
    prompt:
      "Create a new bb loop to flag threads and branches that have gone quiet, weekly.",
  },
] as const satisfies readonly AutomationStarterLoop[];
