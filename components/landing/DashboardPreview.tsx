function Stat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-xl bg-navy-50 p-3 ring-1 ring-navy-100">
      <p className="text-[10px] uppercase tracking-wider text-navy-500">{label}</p>
      <p className="mt-1 text-2xl font-display font-bold text-navy-900">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">{delta}</p>
    </div>
  );
}

function Bar({ h }: { h: number }) {
  return <div className="w-2.5 rounded-t bg-coral-400" style={{ height: `${h}%` }} />;
}

function EarningRow({ brand, mark, color, amount, when }: {
  brand: string; mark: string; color: string; amount: string; when: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${color}`}>
          {mark}
        </span>
        <div className="leading-tight">
          <p className="text-[12px] font-semibold text-navy-800">{brand}</p>
          <p className="text-[10px] text-navy-500">{when}</p>
        </div>
      </div>
      <p className="text-[12px] font-semibold text-emerald-600">+{amount}</p>
    </div>
  );
}

export default function DashboardPreview() {
  const heights = [22, 38, 28, 55, 42, 70, 88];
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="relative w-full max-w-md">
      <div className="rounded-2xl bg-white shadow-xl ring-1 ring-navy-100">
        <div className="flex items-center gap-1.5 rounded-t-2xl border-b border-navy-100 bg-navy-50/60 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
          <span className="ml-3 truncate rounded-md bg-white px-2 py-0.5 text-[10px] text-navy-500 ring-1 ring-navy-100">
            momfluence.app/dashboard
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-navy-500">This week</p>
              <h3 className="mt-0.5 text-lg font-display font-bold text-navy-900">Hi Jess 👋</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              $5/mo · active
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Clicks" value="68" delta="↑ 24%" />
            <Stat label="Sign-ups" value="12" delta="↑ 18%" />
            <Stat label="Earned" value="$72" delta="↑ 31%" />
          </div>

          <div className="mt-4 rounded-xl bg-navy-50/60 p-3 ring-1 ring-navy-100">
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] font-semibold text-navy-700">Earnings · last 7 days</p>
              <p className="text-[11px] font-semibold text-coral-600">$72.40</p>
            </div>
            <div className="mt-3 flex h-16 items-end justify-between gap-1.5">
              {heights.map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <Bar h={h} />
                  <span className="text-[9px] text-navy-400">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-semibold text-navy-700">Recent earnings</p>
            <div className="mt-1 divide-y divide-navy-100">
              <EarningRow brand="HBO Max" mark="M" color="bg-purple-700"   amount="$24.00" when="2h ago"  />
              <EarningRow brand="Sephora" mark="S" color="bg-black"        amount="$18.50" when="yesterday" />
              <EarningRow brand="Target"  mark="T" color="bg-red-600"      amount="$15.00" when="Mon" />
              <EarningRow brand="Hulu"    mark="h" color="bg-green-500"    amount="$14.90" when="Sun" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-coral-50 px-3 py-2 ring-1 ring-coral-200">
            <p className="text-[11px] font-semibold text-coral-700">Next payout · Friday</p>
            <p className="text-[12px] font-bold text-coral-700">$72.40 → Venmo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
