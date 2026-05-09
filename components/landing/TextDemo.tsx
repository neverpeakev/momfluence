function TheirBubble({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`max-w-[78%] self-start rounded-2xl rounded-bl-md bg-navy-100 px-3.5 py-2 text-[13px] leading-snug text-navy-900 ${className}`}>
      {children}
    </div>
  );
}

function MyBubble({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`max-w-[78%] self-end rounded-2xl rounded-br-md bg-[#34b7f1] px-3.5 py-2 text-[13px] leading-snug text-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export default function TextDemo() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="rounded-[2.75rem] bg-navy-900 p-2 shadow-xl ring-1 ring-black/10">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-white">
          <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-navy-900" aria-hidden="true" />
          <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[10px] font-semibold text-navy-700">
            <span>9:41</span>
            <span className="opacity-60">●●●●● 5G</span>
          </div>

          <div className="flex items-center gap-2 border-b border-navy-100 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-100 text-xs font-bold text-coral-700">
              J
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-navy-900">Jess</p>
              <p className="text-[10px] text-navy-500">iMessage</p>
            </div>
          </div>

          <div className="flex h-[260px] flex-col gap-2 overflow-hidden bg-[#fafbfc] px-3 py-3">
            <p className="self-center text-[10px] uppercase tracking-wider text-navy-400">Today 7:42 PM</p>

            <TheirBubble className="demo-bubble-1">
              ok i&apos;m so bored tonight 😩 anything good to watch??
            </TheirBubble>

            <MyBubble className="demo-bubble-2">
              omg YES — start <em>The Pitt</em> on Max. just finished s1, we couldn&apos;t stop 🙌
            </MyBubble>

            <div className="demo-typing self-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-navy-100 px-3.5 py-2.5">
                <span className="demo-dot h-1.5 w-1.5 rounded-full bg-navy-500" />
                <span className="demo-dot demo-dot-2 h-1.5 w-1.5 rounded-full bg-navy-500" />
                <span className="demo-dot demo-dot-3 h-1.5 w-1.5 rounded-full bg-navy-500" />
              </div>
            </div>

            <MyBubble className="demo-bubble-3">
              here&apos;s my link if you sign up — momflu.cc/jess 💖
            </MyBubble>
          </div>

          <div className="border-t border-navy-100 bg-white px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-full border border-navy-200 px-3 py-1.5 text-[11px] text-navy-400">
                iMessage
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-100 text-[10px] text-navy-500">
                ↑
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 -top-2 rotate-6 rounded-full bg-coral-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
        $ tracked
      </div>
    </div>
  );
}
