import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { trackLandingEvent } from "./analytics";
import type { CtaPlacement } from "./site";
import {
  DISCORD_URL,
  GITHUB_URL,
  X_URL,
  SUBSCRIBE_PATH,
  downloadMacosHref,
} from "./site";

/* Marketing CTAs shared by the landing page and the changelog. */

type CtaLinkProps = {
  placement: CtaPlacement;
  /** Omit for a plain inline link (nav/footer); set for button-styled CTAs. */
  className?: string;
  children: ReactNode;
};

export function DownloadLink({ placement, className, children }: CtaLinkProps) {
  return (
    <a className={className} href={downloadMacosHref(placement)}>
      {children}
    </a>
  );
}

export function GitHubLink({ placement, className, children }: CtaLinkProps) {
  return (
    <a
      className={className}
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      onClick={() =>
        trackLandingEvent({
          name: "landing_github_clicked",
          properties: { placement },
        })
      }
    >
      {children}
    </a>
  );
}

export function DiscordLink({ placement, className, children }: CtaLinkProps) {
  return (
    <a
      className={className}
      href={DISCORD_URL}
      target="_blank"
      rel="noreferrer"
      onClick={() =>
        trackLandingEvent({
          name: "landing_discord_clicked",
          properties: { placement },
        })
      }
    >
      {children}
    </a>
  );
}

export function XLink({ placement, className, children }: CtaLinkProps) {
  return (
    <a
      className={className}
      href={X_URL}
      target="_blank"
      rel="noreferrer"
      onClick={() =>
        trackLandingEvent({
          name: "landing_x_clicked",
          properties: { placement },
        })
      }
    >
      {children}
    </a>
  );
}

/* ── Email signup ─────────────────────────────────────────────────── */

type SubscribeStatus = "idle" | "submitting" | "success" | "error";

// Email capture that POSTs to the first-party /api/subscribe Worker route,
// which adds the address to the bb marketing audience in Resend. JS-enhanced:
// it submits inline and swaps to a confirmation rather than navigating.
export const SUBSCRIBE_EMAIL_ID = "subscribe-email";

export function focusSubscribeEmail() {
  document.getElementById(SUBSCRIBE_EMAIL_ID)?.focus();
}

/**
 * The landing page renders this twice, so the input id cannot be a constant.
 * Only the closer's copy keeps SUBSCRIBE_EMAIL_ID: it is the anchor other
 * pages link to (`#subscribe-email` from the blog and changelog), and two
 * elements sharing an id would be invalid HTML and would make
 * `focusSubscribeEmail` depend on document order.
 */
function subscribeInputId(placement: CtaPlacement) {
  return placement === "footer" || placement === "closer"
    ? SUBSCRIBE_EMAIL_ID
    : `${SUBSCRIBE_EMAIL_ID}-${placement}`;
}

export function EmailSignup({ placement }: { placement: CtaPlacement }) {
  const inputId = subscribeInputId(placement);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubscribeStatus>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (inputId !== SUBSCRIBE_EMAIL_ID) {
      return;
    }
    const hash = window.location.hash.replace(/^#/, "");
    if (hash === SUBSCRIBE_EMAIL_ID || hash === "subscribe") {
      focusSubscribeEmail();
    }
  }, [inputId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") {
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch(SUBSCRIBE_PATH, {
        body: JSON.stringify({ email }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? "Something went wrong. Try again.");
        setStatus("error");
        return;
      }
      trackLandingEvent({
        name: "landing_email_subscribed",
        properties: { placement },
      });
      setStatus("success");
    } catch {
      setError("Could not reach the server. Try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p className="subscribe-done" role="status">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          className="subscribe-done-ic"
        />
        You&rsquo;re on the list. We&rsquo;ll be in touch.
      </p>
    );
  }

  return (
    <form
      className="subscribe-form"
      data-status={status}
      onSubmit={submit}
      noValidate
    >
      <input
        id={inputId}
        className="subscribe-input"
        type="email"
        name="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        aria-label="Email address"
        aria-invalid={status === "error"}
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          if (status === "error") {
            setStatus("idle");
          }
        }}
      />
      <button
        type="submit"
        className="btn btn-primary subscribe-btn"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Subscribing…" : "Subscribe"}
      </button>
      {status === "error" ? (
        <span className="subscribe-error" role="alert">
          {error}
        </span>
      ) : null}
    </form>
  );
}

/**
 * The signup, as a room of its own.
 *
 * It appears twice: once below the hero mock, where a reader who is already
 * convinced by the window can act without scrolling the whole page, and once
 * in the closer. The two carry different `placement` values, so the
 * click-through data can say which position actually earns the address rather
 * than crediting one arbitrarily.
 */
export function SubscribeCard({
  placement,
  title,
}: {
  placement: CtaPlacement;
  title: string;
}) {
  return (
    <div className="subscribe-card">
      <div className="subscribe-card-head">
        <h2>{title}</h2>
        <p>Product updates and what we&rsquo;re building next. No spam.</p>
      </div>
      <EmailSignup placement={placement} />
    </div>
  );
}
