function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-navy-50 px-3 py-2 ring-1 ring-navy-100">
      <span className="text-[10px] uppercase tracking-wider text-navy-500">{label}</span>
      <span className="text-[12px] font-semibold text-navy-800">{value} ▾</span>
    </div>
  );
}

function Hook({
  n,
  text,
  highlighted = false,
}: {
  n: number;
  text: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 ring-1 ${
        highlighted ? "bg-coral-50 ring-coral-200" : "bg-white ring-navy-100"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            highlighted ? "bg-coral-500 text-white" : "bg-navy-100 text-navy-600"
          }`}
        >
          {n}
        </span>
        <p
          className={`text-[12px] leading-snug ${
            highlighted ? "text-navy-900 font-semibold" : "text-navy-700"
          }`}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

export default function AIStudioPreview() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white shadow-xl ring-1 ring-navy-100">
        <div className="flex items-center gap-1.5 rounded-t-2xl border-b border-navy-100 bg-navy-50/60 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
          <span className="ml-3 truncate rounded-md bg-white px-2 py-0.5 text-[10px] text-navy-500 ring-1 ring-navy-100">
            momfluence.app/studio
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-coral-400 to-coral-600 text-sm shadow-sm">
              ✨
            </span>
            <div className="leading-tight">
              <p className="text-sm font-display font-bold text-navy-900">
                MomFluence AI Studio
              </p>
              <p className="text-[10px] text-navy-500">Pick a brand. We&apos;ll write the post.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <Field label="Brand" value="HBO Max" />
            <Field label="Format" value="TikTok hooks (5)" />
            <Field label="Tone" value="Curious mom" />
          </div>

          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-navy-900 py-2 text-[12px] font-semibold text-white"
          >
            ✨ Generate
          </button>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-navy-500">
                Output
              </p>
              <p className="text-[10px] text-navy-400">generated in 5.8s · Claude</p>
            </div>
            <div className="mt-2 space-y-2">
              <Hook
                n={1}
                highlighted
                text="I'm a mom of 3. I haven't been excited about a TV show in years. Then I started this last week…"
              />
              <Hook
                n={2}
                text="Bought $12.99 of HBO Max. Best decision I've made all month. Here's why."
              />
              <Hook
                n={3}
                text="Tell me your favorite genre and I'll tell you exactly which Max show to start tonight."
              />
            </div>
            <p className="mt-3 text-[10px] text-navy-400">+ 2 more hooks</p>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-coral-50 px-3 py-2 ring-1 ring-coral-200">
            <p className="text-[11px] font-semibold text-coral-700">Use hook #1</p>
            <p className="text-[11px] font-semibold text-coral-700">
              Copy + open in CapCut →
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
