"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type FormFieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "number"
  | "url"
  | "checkbox";

export type FormField = {
  id: string;
  type: FormFieldType;
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  help_text?: string;
};

export type FormSchema = {
  title?: string;
  description?: string;
  submit_button_label?: string;
  fields: FormField[];
};

type Value = string | boolean | string[];

type Props = {
  offerId: string;
  offerSlug: string;
  schema: FormSchema;
};

function initialValues(schema: FormSchema): Record<string, Value> {
  const init: Record<string, Value> = {};
  for (const f of schema.fields) {
    if (f.type === "multiselect") init[f.id] = [];
    else if (f.type === "checkbox") init[f.id] = false;
    else init[f.id] = "";
  }
  return init;
}

export default function ApplyForm({ offerId, offerSlug, schema }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, Value>>(() => initialValues(schema));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setVal(id: string, v: Value) {
    setValues((prev) => ({ ...prev, [id]: v }));
    if (fieldErrors[id]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function validate(): { ok: boolean; firstErrorId: string | null } {
    const errors: Record<string, string> = {};
    let firstErrorId: string | null = null;
    for (const f of schema.fields) {
      if (!f.required) continue;
      const v = values[f.id];
      let invalid = false;
      let msg = "Required";
      if (f.type === "checkbox") {
        invalid = v !== true;
        msg = "Please confirm to continue";
      } else if (f.type === "multiselect") {
        invalid = !Array.isArray(v) || v.length === 0;
        msg = "Pick at least one option";
      } else {
        invalid = typeof v !== "string" || v.trim() === "";
      }
      if (invalid) {
        errors[f.id] = msg;
        if (!firstErrorId) firstErrorId = f.id;
      }
    }
    setFieldErrors(errors);
    return { ok: Object.keys(errors).length === 0, firstErrorId };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErr(null);
    const result = validate();
    if (!result.ok) {
      if (result.firstErrorId) {
        document
          .getElementById(`field-${result.firstErrorId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/applications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, applicationData: values })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `request failed (${r.status})`);
      router.push(`/catalog/${offerSlug}/apply/submitted`);
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : "failed");
      setSubmitting(false);
    }
  }

  function renderField(f: FormField) {
    const v = values[f.id];

    if (f.type === "textarea") {
      return (
        <textarea
          id={`field-${f.id}`}
          value={v as string}
          onChange={(ev) => setVal(f.id, ev.target.value)}
          placeholder={f.placeholder}
          rows={4}
          className="input"
        />
      );
    }
    if (f.type === "select") {
      return (
        <select
          id={`field-${f.id}`}
          value={v as string}
          onChange={(ev) => setVal(f.id, ev.target.value)}
          className="input"
        >
          <option value="">Select…</option>
          {(f.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    if (f.type === "multiselect") {
      const selected = (Array.isArray(v) ? v : []) as string[];
      return (
        <div id={`field-${f.id}`} className="space-y-2">
          {(f.options ?? []).map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label key={opt} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(ev) => {
                    const next = ev.target.checked
                      ? [...selected, opt]
                      : selected.filter((s) => s !== opt);
                    setVal(f.id, next);
                  }}
                  className="mt-1"
                />
                <span className="text-sm text-navy-700">{opt}</span>
              </label>
            );
          })}
        </div>
      );
    }
    if (f.type === "checkbox") {
      return (
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            id={`field-${f.id}`}
            type="checkbox"
            checked={v === true}
            onChange={(ev) => setVal(f.id, ev.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-navy-700">{f.label}</span>
        </label>
      );
    }
    const inputType = f.type === "url" ? "url" : f.type === "number" ? "number" : "text";
    return (
      <input
        id={`field-${f.id}`}
        type={inputType}
        value={v as string}
        onChange={(ev) => setVal(f.id, ev.target.value)}
        placeholder={f.placeholder}
        className="input"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-6" noValidate>
      {schema.fields.map((f) => (
        <div key={f.id}>
          {f.type !== "checkbox" && (
            <label className="label" htmlFor={`field-${f.id}`}>
              {f.label}
              {f.required && <span className="ml-1 text-coral-600">*</span>}
            </label>
          )}
          {renderField(f)}
          {f.help_text && <p className="mt-1 text-xs text-navy-500">{f.help_text}</p>}
          {fieldErrors[f.id] && (
            <p className="mt-1 text-xs text-coral-700">{fieldErrors[f.id]}</p>
          )}
        </div>
      ))}

      {submitErr && (
        <div className="rounded-lg border border-coral-200 bg-coral-50 p-3">
          <p className="text-sm text-coral-700">{submitErr}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Submitting…" : (schema.submit_button_label ?? "Submit application")}
        </button>
        <span className="text-xs text-navy-500">We&apos;ll review within 1-2 business days.</span>
      </div>
    </form>
  );
}
