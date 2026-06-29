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
  {
    name: "Dependency security scan",
    icon: "Lock",
    category: "Maintenance",
    description: "Scan dependencies for known vulnerabilities.",
    schedule: "Daily 6am",
    prompt:
      "Create a new bb loop to scan dependencies for known vulnerabilities every morning.",
  },
  {
    name: "Lockfile drift check",
    icon: "FileDiff",
    category: "Maintenance",
    description: "Flag lockfile and manifest drift.",
    schedule: "Weekdays 7am",
    prompt:
      "Create a new bb loop to flag lockfile and manifest drift on weekday mornings.",
  },
  {
    name: "Weekly activity digest",
    icon: "Mail",
    category: "Digests",
    description: "Summarize the week's threads and changes.",
    schedule: "Fridays 5pm",
    prompt:
      "Create a new bb loop to summarize the week's threads and changes every Friday afternoon.",
  },
  {
    name: "PR review queue",
    icon: "GitPullRequest",
    category: "Digests",
    description: "Surface open pull requests awaiting review.",
    schedule: "Weekdays 10am",
    prompt:
      "Create a new bb loop to surface open pull requests awaiting review on weekday mornings.",
  },
  {
    name: "Error rate watch",
    icon: "Zap",
    category: "Monitoring",
    description: "Alert when the error rate spikes.",
    schedule: "Hourly",
    prompt:
      "Create a new bb loop to alert me when the error rate spikes, checked hourly.",
  },
  {
    name: "Endpoint uptime probe",
    icon: "Globe",
    category: "Monitoring",
    description: "Probe an endpoint and alert on failure.",
    schedule: "Every 15 minutes",
    prompt:
      "Create a new bb loop to probe an endpoint every 15 minutes and alert on failure.",
  },
  {
    name: "Performance regression watch",
    icon: "AlertTriangle",
    category: "Monitoring",
    description: "Flag latency and benchmark regressions.",
    schedule: "Daily 9pm",
    prompt:
      "Create a new bb loop to flag latency and benchmark regressions each night.",
  },
  {
    name: "Changelog update",
    icon: "Edit",
    category: "Releases",
    description: "Update the changelog with recent merges.",
    schedule: "Fridays 4pm",
    prompt:
      "Create a new bb loop to update the changelog with recent merges every Friday afternoon.",
  },
  {
    name: "Release readiness check",
    icon: "CircleCheck",
    category: "Releases",
    description: "Verify changelog, migrations, and tests before tagging.",
    schedule: "Thursdays 1pm",
    prompt:
      "Create a new bb loop to verify changelog, migrations, and tests before tagging, on Thursday afternoons.",
  },
] as const satisfies readonly AutomationStarterLoop[];
