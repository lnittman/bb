import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon.js";
import { LIST_HOVER_TRANSITION } from "@/components/ui/motion.js";
import { PageShell } from "@/components/ui/page-shell.js";
import { Pill } from "@/components/ui/pill.js";
import { cn } from "@/lib/utils";

type PlanningTab = "rings" | "packets";
type PlanningTone = "active" | "ready" | "queued" | "blocked" | "done";

interface PlanningTabOption {
  id: PlanningTab;
  label: string;
  count: number;
}

interface OperatingRing {
  id: string;
  name: string;
  summary: string;
  whenToUse: string;
  projects: readonly string[];
  icon: IconName;
  status: PlanningTone;
}

interface WorkerPacket {
  id: string;
  objective: string;
  target: string;
  mode: string;
  verification: string;
  stopCondition: string;
  status: PlanningTone;
}

const OPERATING_RINGS: readonly OperatingRing[] = [
  {
    id: "core",
    name: "Core ring",
    summary:
      "Doctrine, substrate, cockpit, factory, Atoi, bb, docs, mono, agent OS.",
    whenToUse:
      "Use scarce judgment here when boundaries, runtime homes, package doctrine, BB control-plane shape, or mono/agent-OS doctrine are unclear.",
    projects: [
      "config",
      "packages",
      "abbie",
      "agents",
      "apps/apps",
      "atoi",
      "bb",
      "docs",
      "mono",
      "~/.agents",
    ],
    icon: "Layers",
    status: "active",
  },
  {
    id: "product",
    name: "Product proving ring",
    summary: "Kumori, Luke, Packet, Saya, plugins, and elevated product lanes.",
    whenToUse:
      "Pull a product forward only when it proves or falsifies a larger product, substrate, or boundary claim.",
    projects: [
      "kumori",
      "luke",
      "packet",
      "saya",
      "saya-plugins",
      "elevated products",
    ],
    icon: "Target",
    status: "ready",
  },
  {
    id: "alignment",
    name: "Alignment ring",
    summary:
      "Supporting apps, source surfaces, references, plugins, and long-tail repos.",
    whenToUse:
      "Keep these coherent and visible; avoid spending planning judgment here unless a core decision depends on it.",
    projects: [
      "bittie",
      "captures",
      "cic",
      "components",
      "keris",
      "keris-plugins",
      "koto",
      "template",
      "logs",
      "notes -> packet",
      "press -> packet",
      "email",
      "yuba",
      "voet",
      "webs",
      "sine",
      "squish",
      "sagu",
      "~/.references",
      "long-tail apps",
    ],
    icon: "Workflow",
    status: "queued",
  },
];

const WORKER_PACKETS: readonly WorkerPacket[] = [
  {
    id: "packet-sequence",
    objective: "Decide Packet convergence sequencing.",
    target: "apps/packet + docs/packet-port-manifest.md",
    mode: "Strategy first",
    verification: "ruling ledger, then bounded Codex worker packets",
    stopCondition: "Stop before porting Notes or Press product work.",
    status: "active",
  },
  {
    id: "factory-rename",
    objective: "Clarify apps/apps versus apps/factory doctrine.",
    target: "apps/apps + factory rename candidate",
    mode: "Ruling first",
    verification: "taxonomy ruling plus downstream worker packets",
    stopCondition: "Stop before renaming paths or rewriting imports.",
    status: "ready",
  },
  {
    id: "product-proving",
    objective: "Create scoped project threads for product proving.",
    target: "kumori, luke, packet, saya, saya-plugins",
    mode: "Project-bound",
    verification: "focused gates plus visual proof per product",
    stopCondition: "Stop when the product no longer informs a bigger ruling.",
    status: "queued",
  },
  {
    id: "stale-claims",
    objective: "Cull stale alignment claims before new launches.",
    target: "docs, references, long-tail apps",
    mode: "Read-only audit",
    verification: "source citation and exact blocker class",
    stopCondition: "Stop before mutating code or docs without a ruling.",
    status: "blocked",
  },
];

const PLANNING_TABS: readonly PlanningTabOption[] = [
  { id: "rings", label: "Rings", count: OPERATING_RINGS.length },
  { id: "packets", label: "Packets", count: WORKER_PACKETS.length },
];

const STATUS_LABEL: Record<PlanningTone, string> = {
  active: "Active",
  ready: "Ready",
  queued: "Queued",
  blocked: "Blocked",
  done: "Done",
};

const STATUS_DOT_CLASS: Record<PlanningTone, string> = {
  active: "bg-foreground",
  ready: "bg-muted-foreground/70",
  queued: "bg-muted-foreground/35",
  blocked: "bg-destructive",
  done: "bg-foreground/75",
};

const STATUS_TEXT_CLASS: Record<PlanningTone, string> = {
  active: "text-foreground",
  ready: "text-muted-foreground",
  queued: "text-subtle-foreground",
  blocked: "text-destructive",
  done: "text-foreground",
};

function StatusLabel({ tone }: { tone: PlanningTone }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 text-xs font-medium",
        STATUS_TEXT_CLASS[tone],
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT_CLASS[tone])}
      />
      <span className="truncate">{STATUS_LABEL[tone]}</span>
    </span>
  );
}

function PlanningTabs({
  activeTab,
  onSelect,
}: {
  activeTab: PlanningTab;
  onSelect: (tab: PlanningTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Planning sections"
      className="flex min-w-0 items-center gap-1 overflow-x-auto px-1"
    >
      {PLANNING_TABS.map((tab) => {
        const isSelected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            id={`planning-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`planning-panel-${tab.id}`}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "inline-flex h-7 shrink-0 items-center rounded-md px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              LIST_HOVER_TRANSITION,
              isSelected
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-state-hover hover:text-foreground",
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "ml-1 shrink-0 font-normal tabular-nums",
                isSelected ? "text-muted-foreground" : "text-subtle-foreground",
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RingRow({
  ring,
  expanded,
  onToggle,
}: {
  ring: OperatingRing;
  expanded: boolean;
  onToggle: () => void;
}) {
  const panelId = `planning-ring-${ring.id}`;
  return (
    <article className="rounded-md">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
        className={cn(
          "grid min-h-16 w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-state-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          expanded && "bg-muted/50",
          LIST_HOVER_TRANSITION,
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
          <Icon name={ring.icon} className="size-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-foreground">
            {ring.name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {ring.summary}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <StatusLabel tone={ring.status} />
          <Icon
            name={expanded ? "ChevronUp" : "ChevronDown"}
            className="size-3.5 text-muted-foreground"
            aria-hidden
          />
        </span>
      </button>
      {expanded ? (
        <div id={panelId} className="px-3 pb-3 pt-1 md:pl-14">
          <p className="max-w-2xl text-pretty text-xs leading-5 text-muted-foreground">
            {ring.whenToUse}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ring.projects.map((project) => (
              <Pill
                key={project}
                variant="outline"
                size="sm"
                className="max-w-full"
              >
                {project}
              </Pill>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function RingsPanel() {
  const [expandedRingId, setExpandedRingId] = useState("core");
  return (
    <section
      id="planning-panel-rings"
      role="tabpanel"
      aria-labelledby="planning-tab-rings"
      className="space-y-2"
    >
      {OPERATING_RINGS.map((ring) => (
        <RingRow
          key={ring.id}
          ring={ring}
          expanded={expandedRingId === ring.id}
          onToggle={() =>
            setExpandedRingId((current) => (current === ring.id ? "" : ring.id))
          }
        />
      ))}
    </section>
  );
}

function PacketRow({
  packet,
  expanded,
  onToggle,
}: {
  packet: WorkerPacket;
  expanded: boolean;
  onToggle: () => void;
}) {
  const panelId = `planning-packet-${packet.id}`;
  return (
    <article className="rounded-md">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
        className={cn(
          "grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-state-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          expanded && "bg-muted/50",
          LIST_HOVER_TRANSITION,
        )}
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-foreground">
            {packet.objective}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {packet.target}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <StatusLabel tone={packet.status} />
          <Icon
            name={expanded ? "ChevronUp" : "ChevronDown"}
            className="size-3.5 text-muted-foreground"
            aria-hidden
          />
        </span>
      </button>
      {expanded ? (
        <div id={panelId} className="grid gap-2 px-3 pb-3 pt-1 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-foreground">Mode</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {packet.mode}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Verification</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {packet.verification}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Stop</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {packet.stopCondition}
            </p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function PacketsPanel() {
  const [expandedPacketId, setExpandedPacketId] = useState("planning-ui");
  return (
    <section
      id="planning-panel-packets"
      role="tabpanel"
      aria-labelledby="planning-tab-packets"
      className="space-y-2"
    >
      {WORKER_PACKETS.map((packet) => (
        <PacketRow
          key={packet.id}
          packet={packet}
          expanded={expandedPacketId === packet.id}
          onToggle={() =>
            setExpandedPacketId((current) =>
              current === packet.id ? "" : packet.id,
            )
          }
        />
      ))}
    </section>
  );
}

export function PlanningView() {
  const [activeTab, setActiveTab] = useState<PlanningTab>("rings");

  return (
    <PageShell contentClassName="pt-3 md:pt-4">
      <div className="w-full space-y-3" aria-label="Planning">
        <PlanningTabs activeTab={activeTab} onSelect={setActiveTab} />

        {activeTab === "rings" ? <RingsPanel /> : null}
        {activeTab === "packets" ? <PacketsPanel /> : null}
      </div>
    </PageShell>
  );
}
