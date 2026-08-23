import {
  Loading03Icon,
  MessageQuestionIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type {
  ComponentType,
  CSSProperties,
  ReactElement,
  ReactNode,
} from "react";

export type DemoGlyphSize = 12 | 14 | 16;
export type DemoIcon = ComponentType<{ className?: string }>;
export type DemoLeading =
  | { kind: "none" }
  | {
      kind: "glyph";
      Icon: DemoIcon;
      size: DemoGlyphSize;
      label: string | null;
    }
  | { kind: "avatar"; src: string; alt: string };
export type DemoActivity =
  | { kind: "idle" }
  | { kind: "working"; label: string }
  | { kind: "needs-input"; label: string };
export type DemoThreadBase = Readonly<{
  id: string;
  title: string;
  tone: "normal" | "quiet";
  leading: DemoLeading;
  activity: DemoActivity;
  attentionRevision: number;
  initialReadThroughRevision: number;
}>;
export type DemoThread =
  | (DemoThreadBase & { interaction: "openable"; href: string })
  | (DemoThreadBase & { interaction: "scenery" });
export type DemoThreadSceneProps = Readonly<{
  threads: readonly DemoThread[];
  selectedId: string | null;
  onSelectedIdChange: (id: string) => void;
  children: ReactNode;
}>;

export type DemoThreadReadState = ReadonlyMap<string, number>;
export type DemoThreadReadAction =
  | Readonly<{ type: "reconcile"; threads: readonly DemoThread[] }>
  | Readonly<{
      type: "mark-read";
      threadId: string;
      attentionRevision: number;
    }>;

export type DemoResolvedThreadStatus =
  | "needs-input"
  | "working"
  | "unread"
  | "none";

type DemoThreadSceneContextValue = Readonly<{
  threadsById: ReadonlyMap<string, DemoThread>;
  selectedId: string | null;
  readThroughById: DemoThreadReadState;
  activate: (thread: Extract<DemoThread, { interaction: "openable" }>) => void;
}>;

const DemoThreadSceneContext = createContext<DemoThreadSceneContextValue | null>(
  null,
);

const WorkingStatusIcon = ({ className }: { className?: string }) => (
  <HugeiconsIcon icon={Loading03Icon} className={className} />
);

const NeedsInputStatusIcon = ({ className }: { className?: string }) => (
  <HugeiconsIcon icon={MessageQuestionIcon} className={className} />
);

export function createDemoThreadReadState(
  threads: readonly DemoThread[],
  selectedId: string | null,
): DemoThreadReadState {
  const readThroughById = new Map<string, number>();
  for (const thread of threads) {
    readThroughById.set(
      thread.id,
      thread.id === selectedId
        ? Math.max(
            thread.initialReadThroughRevision,
            thread.attentionRevision,
          )
        : thread.initialReadThroughRevision,
    );
  }
  return readThroughById;
}

export function demoThreadReadReducer(
  state: DemoThreadReadState,
  action: DemoThreadReadAction,
): DemoThreadReadState {
  if (action.type === "mark-read") {
    const currentRevision = state.get(action.threadId) ?? 0;
    if (currentRevision >= action.attentionRevision) {
      return state;
    }
    const next = new Map(state);
    next.set(action.threadId, action.attentionRevision);
    return next;
  }

  const next = new Map<string, number>();
  let changed = state.size !== action.threads.length;
  for (const thread of action.threads) {
    const currentRevision = state.get(thread.id);
    const nextRevision = Math.max(
      currentRevision ?? thread.initialReadThroughRevision,
      thread.initialReadThroughRevision,
    );
    next.set(thread.id, nextRevision);
    if (currentRevision !== nextRevision) {
      changed = true;
    }
  }
  return changed ? next : state;
}

export function resolveDemoThreadStatus(
  thread: DemoThread,
  readThroughRevision: number,
): DemoResolvedThreadStatus {
  if (thread.activity.kind === "needs-input") {
    return "needs-input";
  }
  if (thread.activity.kind === "working") {
    return "working";
  }
  return thread.attentionRevision > readThroughRevision ? "unread" : "none";
}

export function DemoThreadScene({
  threads,
  selectedId,
  onSelectedIdChange,
  children,
}: DemoThreadSceneProps): ReactElement {
  const [readThroughById, dispatch] = useReducer(
    demoThreadReadReducer,
    createDemoThreadReadState(threads, selectedId),
  );
  const threadsById = useMemo(() => {
    const next = new Map<string, DemoThread>();
    for (const thread of threads) {
      if (next.has(thread.id)) {
        throw new Error(`Duplicate demo thread id: ${thread.id}`);
      }
      next.set(thread.id, thread);
    }
    return next;
  }, [threads]);
  const selectedThread = selectedId === null ? null : threadsById.get(selectedId);

  useEffect(() => {
    dispatch({ type: "reconcile", threads });
  }, [threads]);

  useEffect(() => {
    if (!selectedThread) {
      return;
    }
    dispatch({
      type: "mark-read",
      threadId: selectedThread.id,
      attentionRevision: selectedThread.attentionRevision,
    });
  }, [selectedThread?.attentionRevision, selectedThread?.id]);

  const value = useMemo<DemoThreadSceneContextValue>(
    () => ({
      threadsById,
      selectedId,
      readThroughById,
      activate: (thread) => {
        dispatch({
          type: "mark-read",
          threadId: thread.id,
          attentionRevision: thread.attentionRevision,
        });
        onSelectedIdChange(thread.id);
      },
    }),
    [onSelectedIdChange, readThroughById, selectedId, threadsById],
  );

  return (
    <DemoThreadSceneContext.Provider value={value}>
      {children}
    </DemoThreadSceneContext.Provider>
  );
}

export type DemoThreadNode = Readonly<{
  threadId: string;
  children: readonly DemoThreadNode[];
}>;
export type DemoThreadProject = Readonly<{
  id: string;
  label: string;
  rows: readonly DemoThreadNode[];
}>;
export type DemoThreadRailProps = Readonly<{
  ariaLabel: string;
  header: ReactNode | null;
  projects: readonly DemoThreadProject[];
}>;

type DemoThreadRowStyle = CSSProperties & {
  "--demo-thread-depth": number;
};

function useDemoThreadScene(): DemoThreadSceneContextValue {
  const value = useContext(DemoThreadSceneContext);
  if (!value) {
    throw new Error("Demo thread primitives must be inside DemoThreadScene");
  }
  return value;
}

function DemoThreadLeadingView({
  leading,
}: Readonly<{ leading: DemoLeading }>): ReactNode {
  if (leading.kind === "none") {
    return null;
  }
  if (leading.kind === "avatar") {
    return (
      <span className="demo-thread-row__leading">
        <img src={leading.src} alt={leading.alt} width={16} height={16} />
      </span>
    );
  }
  return (
    <span className="demo-thread-row__leading">
      <DemoGlyph
        Icon={leading.Icon}
        size={leading.size}
        label={leading.label}
      />
    </span>
  );
}

function DemoThreadStatusView({
  thread,
  readThroughRevision,
}: Readonly<{
  thread: DemoThread;
  readThroughRevision: number;
}>): ReactElement {
  const status = resolveDemoThreadStatus(thread, readThroughRevision);
  if (status === "needs-input") {
    return (
      <span className="demo-thread-row__status" data-status={status}>
        <DemoGlyph
          Icon={NeedsInputStatusIcon}
          size={16}
          label={thread.activity.kind === "needs-input" ? thread.activity.label : null}
        />
      </span>
    );
  }
  if (status === "working") {
    return (
      <span className="demo-thread-row__status" data-status={status}>
        <DemoGlyph
          Icon={WorkingStatusIcon}
          size={16}
          label={thread.activity.kind === "working" ? thread.activity.label : null}
        />
      </span>
    );
  }
  if (status === "unread") {
    return (
      <span className="demo-thread-row__status" data-status={status}>
        <span
          className="demo-thread-row__unread-dot"
          role="img"
          aria-label="Unread"
        />
      </span>
    );
  }
  return (
    <span
      className="demo-thread-row__status"
      data-status={status}
      aria-hidden="true"
    />
  );
}

function DemoThreadRow({
  thread,
  depth,
}: Readonly<{ thread: DemoThread; depth: number }>): ReactElement {
  const { selectedId, readThroughById, activate } = useDemoThreadScene();
  const selected = selectedId === thread.id;
  const rowStyle: DemoThreadRowStyle = { "--demo-thread-depth": depth };
  const content = (
    <>
      <DemoThreadLeadingView leading={thread.leading} />
      <span className="demo-thread-row__title">{thread.title}</span>
      <DemoThreadStatusView
        thread={thread}
        readThroughRevision={
          readThroughById.get(thread.id) ?? thread.initialReadThroughRevision
        }
      />
    </>
  );

  if (thread.interaction === "scenery") {
    return (
      <div
        className="demo-thread-row"
        data-interaction="scenery"
        data-selected={selected}
        data-tone={thread.tone}
        style={rowStyle}
      >
        {content}
      </div>
    );
  }

  return (
    <a
      className="demo-thread-row"
      href={thread.href}
      data-interaction="openable"
      data-selected={selected}
      data-tone={thread.tone}
      aria-current={selected ? "page" : undefined}
      aria-label={`Open ${thread.title}`}
      style={rowStyle}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        activate(thread);
      }}
    >
      {content}
    </a>
  );
}

function DemoThreadNodeView({
  node,
  depth,
}: Readonly<{ node: DemoThreadNode; depth: number }>): ReactElement {
  const { threadsById } = useDemoThreadScene();
  const thread = threadsById.get(node.threadId);
  if (!thread) {
    throw new Error(`Unknown demo thread id: ${node.threadId}`);
  }
  const nodeStyle: DemoThreadRowStyle = { "--demo-thread-depth": depth };
  return (
    <div className="demo-thread-node" style={nodeStyle}>
      <DemoThreadRow thread={thread} depth={depth} />
      {node.children.length > 0 ? (
        <div className="demo-thread-children">
          {node.children.map((child) => (
            <DemoThreadNodeView
              key={child.threadId}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DemoThreadRail({
  ariaLabel,
  header,
  projects,
}: DemoThreadRailProps): ReactElement {
  return (
    <nav className="demo-project-list" aria-label={ariaLabel}>
      {header}
      {projects.map((project) => (
        <section
          className="demo-thread-project"
          aria-label={project.label}
          key={project.id}
        >
          <div className="demo-project-row">{project.label}</div>
          <div className="demo-thread-list">
            {project.rows.map((node) => (
              <DemoThreadNodeView key={node.threadId} node={node} depth={0} />
            ))}
          </div>
        </section>
      ))}
    </nav>
  );
}

export type DemoSelectedThreadProps = Readonly<{
  children: (
    thread: Extract<DemoThread, { interaction: "openable" }> | null,
  ) => ReactNode;
}>;

export function DemoSelectedThread({
  children,
}: DemoSelectedThreadProps): ReactNode {
  const { selectedId, threadsById } = useDemoThreadScene();
  const selectedThread = selectedId === null ? null : threadsById.get(selectedId);
  return children(
    selectedThread?.interaction === "openable" ? selectedThread : null,
  );
}

export type DemoSidebarActionRowProps = Readonly<{
  label: string;
  Icon: DemoIcon;
  selected: boolean;
  onActivate: () => void;
  trailing: ReactNode | null;
}>;

export function DemoSidebarActionRow({
  label,
  Icon,
  selected,
  onActivate,
  trailing,
}: DemoSidebarActionRowProps): ReactElement {
  return (
    <button
      className="demo-sidebar-action-row"
      type="button"
      data-selected={selected}
      aria-pressed={selected}
      onClick={onActivate}
    >
      <DemoGlyph Icon={Icon} size={16} label={null} />
      <span className="demo-sidebar-action-row__label">{label}</span>
      {trailing === null ? null : (
        <span className="demo-sidebar-action-row__trailing">{trailing}</span>
      )}
    </button>
  );
}

export type DemoWindowChromeProps = Readonly<{
  ariaLabel: string;
  leading: ReactNode | null;
  title: ReactNode;
  trailing: ReactNode | null;
}>;

export function DemoWindowChrome({
  ariaLabel,
  leading,
  title,
  trailing,
}: DemoWindowChromeProps): ReactElement {
  return (
    <div className="demo-window__chrome" role="group" aria-label={ariaLabel}>
      <span className="demo-window__chrome-leading">{leading}</span>
      <span className="demo-window__chrome-title">{title}</span>
      <span className="demo-window__chrome-trailing">{trailing}</span>
    </div>
  );
}

export type DemoGlyphProps = Readonly<{
  Icon: DemoIcon;
  size: 12 | 14 | 16;
  label: string | null;
}>;

export function DemoGlyph({
  Icon,
  size,
  label,
}: DemoGlyphProps): ReactElement {
  return (
    <span
      className="demo-glyph"
      data-size={size}
      role={label === null ? undefined : "img"}
      aria-label={label === null ? undefined : label}
      aria-hidden={label === null ? "true" : undefined}
    >
      <Icon className="demo-glyph__icon" />
    </span>
  );
}
