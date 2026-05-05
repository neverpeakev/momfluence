"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { relativeTime } from "@/lib/relative-time";

type ApplicationStatus = "pending" | "approved" | "rejected" | "waitlisted" | "withdrawn";

type SchemaField = {
  id: string;
  type: string;
  label: string;
  options?: string[];
};

type SchemaShape = {
  fields?: SchemaField[];
} | null;

export type ApplicationView = {
  id: string;
  status: ApplicationStatus;
  application_data: Record<string, unknown>;
  submitted_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  reviewer_notes: string | null;
  rejected_reason: string | null;
  offers: {
    slug: string;
    title: string;
    brand: string | null;
    application_form_schema: SchemaShape;
  };
  applicant: {
    email: string;
    display_name: string | null;
    instagram_handle: string | null;
  } | null;
  reviewer: {
    display_name: string | null;
    email: string;
  } | null;
};

type ActionPanel = "approve" | "reject" | "waitlist" | null;

function statusPillClass(status: ApplicationStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-800";
    case "approved":
      return "bg-green-50 text-green-700";
    case "rejected":
      return "bg-rose-50 text-rose-700";
    case "waitlisted":
      return "bg-stone-100 text-stone-700";
    case "withdrawn":
      return "bg-stone-100 text-stone-500";
  }
}

export default function ApplicationRow({ application }: { application: ApplicationView }) {
  const router = useRouter();
  const [answersOpen, setAnswersOpen] = useState(false);
  const [actionPanel, setActionPanel] = useState<ActionPanel>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [reviewerNotes, setReviewerNotes] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");

  const { offers: offer, applicant, reviewer, application_data } = application;
  const schemaFields = offer.application_form_schema?.fields ?? [];
  const isPending = application.status === "pending";

  function openPanel(p: ActionPanel) {
    if (actionPanel === p) {
      setActionPanel(null);
      return;
    }
    setActionPanel(p);
    setReviewerNotes("");
    setRejectedReason("");
    setErr(null);
  }

  async function decide(action: "approve" | "reject" | "waitlist") {
    setErr(null);
    if (action === "reject" && rejectedReason.trim() === "") {
      setErr("Rejection reason is required.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/admin/applications/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: application.id,
          action,
          reviewer_notes: reviewerNotes.trim() || undefined,
          rejected_reason: action === "reject" ? rejectedReason.trim() : undefined
        })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `request failed (${r.status})`);
      setActionPanel(null);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-navy-900">
            {applicant?.display_name || applicant?.email || "(unknown applicant)"}
          </p>
          <p className="text-xs text-navy-500">
            {applicant?.email}
            {applicant?.instagram_handle && ` · IG @${applicant.instagram_handle}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`pill ${statusPillClass(application.status)}`}>
            {application.status}
          </span>
          <span className="text-xs text-navy-500">
            {relativeTime(application.submitted_at)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {offer.brand && (
          <span className="pill bg-coral-50 text-coral-700 uppercase tracking-wide">
            {offer.brand}
          </span>
        )}
        <span className="text-sm text-navy-700">{offer.title}</span>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setAnswersOpen((v) => !v)}
          className="text-sm text-navy-600 hover:text-navy-800"
        >
          {answersOpen ? "▾ Hide answers" : "▸ View answers"}
        </button>

        {answersOpen && (
          <div className="mt-3 space-y-3 rounded-lg bg-navy-50 p-4">
            {schemaFields.length === 0 ? (
              <p className="text-xs text-navy-500">No schema available; showing raw data.</p>
            ) : null}
            {schemaFields.map((f) => (
              <AnswerRow key={f.id} field={f} value={application_data[f.id]} />
            ))}
            {schemaFields.length === 0 && (
              <pre className="text-xs text-navy-700 overflow-x-auto">
                {JSON.stringify(application_data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {!isPending && (application.reviewer_notes || application.rejected_reason || reviewer) && (
        <div className="rounded-lg border border-navy-100 p-3 text-sm space-y-1">
          {reviewer && (
            <p className="text-xs text-navy-500">
              Reviewed by {reviewer.display_name || reviewer.email} ·{" "}
              {relativeTime(application.reviewed_at)}
            </p>
          )}
          {application.rejected_reason && (
            <p>
              <span className="text-xs uppercase tracking-wide text-rose-700">
                Reason given
              </span>
              <br />
              <span className="text-navy-800">{application.rejected_reason}</span>
            </p>
          )}
          {application.reviewer_notes && (
            <p>
              <span className="text-xs uppercase tracking-wide text-navy-500">
                Internal note
              </span>
              <br />
              <span className="text-navy-700">{application.reviewer_notes}</span>
            </p>
          )}
        </div>
      )}

      {isPending && (
        <div className="border-t border-navy-100 pt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openPanel("approve")}
              className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-semibold"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => openPanel("waitlist")}
              className="btn-ghost text-sm px-4 py-2"
            >
              Waitlist
            </button>
            <button
              type="button"
              onClick={() => openPanel("reject")}
              className="rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 px-4 py-2 text-sm font-semibold"
            >
              Reject
            </button>
          </div>

          {actionPanel === "approve" && (
            <DecisionPanel
              title="Approve application"
              tone="green"
              onCancel={() => setActionPanel(null)}
              onConfirm={() => decide("approve")}
              submitting={submitting}
              err={err}
              confirmLabel="Confirm approve"
            >
              <Notes value={reviewerNotes} onChange={setReviewerNotes} />
            </DecisionPanel>
          )}

          {actionPanel === "waitlist" && (
            <DecisionPanel
              title="Move to waitlist"
              tone="stone"
              onCancel={() => setActionPanel(null)}
              onConfirm={() => decide("waitlist")}
              submitting={submitting}
              err={err}
              confirmLabel="Confirm waitlist"
            >
              <Notes value={reviewerNotes} onChange={setReviewerNotes} />
            </DecisionPanel>
          )}

          {actionPanel === "reject" && (
            <DecisionPanel
              title="Reject application"
              tone="rose"
              onCancel={() => setActionPanel(null)}
              onConfirm={() => decide("reject")}
              submitting={submitting}
              err={err}
              confirmLabel="Confirm reject"
            >
              <div>
                <label className="label" htmlFor={`reject-reason-${application.id}`}>
                  Rejection reason <span className="text-coral-600">*</span>
                </label>
                <textarea
                  id={`reject-reason-${application.id}`}
                  value={rejectedReason}
                  onChange={(e) => setRejectedReason(e.target.value)}
                  rows={3}
                  className="input"
                  placeholder="Will be visible to the applicant if we email them later."
                />
              </div>
              <Notes value={reviewerNotes} onChange={setReviewerNotes} />
            </DecisionPanel>
          )}
        </div>
      )}
    </div>
  );
}

function Notes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">Internal note (optional)</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="input"
        placeholder="For your own/team reference. Not shown to applicant."
      />
    </div>
  );
}

function DecisionPanel({
  title,
  tone,
  onCancel,
  onConfirm,
  submitting,
  err,
  confirmLabel,
  children
}: {
  title: string;
  tone: "green" | "rose" | "stone";
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
  err: string | null;
  confirmLabel: string;
  children: React.ReactNode;
}) {
  const tones = {
    green: "border-green-200 bg-green-50/40",
    rose: "border-rose-200 bg-rose-50/40",
    stone: "border-stone-200 bg-stone-50"
  } as const;
  const confirmCls = {
    green: "bg-green-600 hover:bg-green-700 text-white",
    rose: "bg-rose-600 hover:bg-rose-700 text-white",
    stone: "bg-stone-600 hover:bg-stone-700 text-white"
  }[tone];

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${tones[tone]}`}>
      <p className="text-sm font-semibold text-navy-800">{title}</p>
      {children}
      {err && <p className="text-xs text-coral-700">{err}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${confirmCls}`}
        >
          {submitting ? "Saving…" : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="btn-ghost text-sm px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AnswerRow({ field, value }: { field: SchemaField; value: unknown }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-navy-500">{field.label}</p>
      <div className="mt-1 text-sm text-navy-800">{renderAnswer(field, value)}</div>
    </div>
  );
}

function renderAnswer(field: SchemaField, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-navy-400">—</span>;
  }
  if (field.type === "checkbox") {
    return value === true ? "✓ Acknowledged" : "✗ Not acknowledged";
  }
  if (field.type === "multiselect") {
    if (!Array.isArray(value) || value.length === 0)
      return <span className="text-navy-400">—</span>;
    return value.join(", ");
  }
  if (field.type === "url" && typeof value === "string") {
    return (
      <a href={value} target="_blank" rel="noreferrer noopener">
        {value}
      </a>
    );
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return <code className="text-xs">{JSON.stringify(value)}</code>;
}
