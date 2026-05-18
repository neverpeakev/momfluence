/* global React */
/**
 * Shared primitives for LP Baseline v2 prototype.
 *
 * Exposes on window:
 *   useInView(opts) → [ref, inView]   — IntersectionObserver hook
 *   Reveal({as, dir, delay, ...})      — wraps children in scroll-reveal CSS
 *   Section({id, n, name, file, event, eyebrow, h2, sub, children, ...})
 *   Anno({children, top, right, bottom, left, side})  — pin annotation
 *   AnnoSpec({rows})                   — bottom-of-section spec block
 *   AssetSlot({label, name, dims, height})
 *   EarningsDisclaimer({density})
 *   Eyebrow / SectionHeader
 */
const { useEffect, useRef, useState, useCallback } = React;

function useInView({ amount = 0.3, once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            if (once) io.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold: amount }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [amount, once]);
  return [ref, inView];
}

function Reveal({ as: Tag = "div", dir = "up", delay = 0, scale = false, className = "", style, children, ...rest }) {
  const [ref, inView] = useInView({ amount: 0.25 });
  const cls = [
    "reveal",
    dir === "left" && "reveal-l",
    dir === "right" && "reveal-r",
    scale && "reveal-scale",
    inView && "in",
    className,
  ].filter(Boolean).join(" ");
  return (
    <Tag ref={ref} className={cls} style={{ transitionDelay: `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

function Eyebrow({ tone = "coral", children, className = "" }) {
  const tones = {
    coral: "text-coral-600",
    navy: "text-navy-500",
    "navy-strong": "text-navy-700",
  };
  return (
    <p className={`text-xs uppercase tracking-widest font-semibold ${tones[tone] || tones.coral} ${className}`}>
      {children}
    </p>
  );
}

function Anno({ children, side = "right" }) {
  return <span className={`anno anno-pin ${side}`}>{children}</span>;
}

function AnnoSpec({ rows }) {
  return (
    <dl className="anno anno-spec">
      {rows.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function AssetSlot({ label = "Asset slot", name, dims, height = 120, className = "", children }) {
  return (
    <div className={`asset-slot ${className}`} style={{ minHeight: height }}>
      <div className="label">{label}</div>
      <div className="name">{name}</div>
      {dims ? <div className="dims">{dims}</div> : null}
      {children}
    </div>
  );
}

function EarningsDisclaimer({ density = "compact", className = "" }) {
  if (density === "compact") {
    return (
      <p className={`text-xs text-navy-500 ${className}`}>
        Example. Individual results vary.{" "}
        <a href="/disclosures/earnings" className="underline">See earnings disclaimer</a>.
      </p>
    );
  }
  return (
    <div className={`rounded-lg bg-navy-50 px-4 py-3 text-xs text-navy-600 ring-1 ring-navy-100 ${className}`}>
      <p>
        <span className="font-semibold text-navy-700">Earnings disclaimer:</span>{" "}
        Figures shown are illustrative examples, not guarantees. Actual earnings depend on how often you share,
        who you share with, and which brand programs you use. Most new members earn less in the first 30 days
        than in subsequent months as their links accumulate clicks.{" "}
        <a href="/disclosures/earnings" className="underline">Read the full disclaimer</a>.
      </p>
    </div>
  );
}

function Section({ id, n, name, file, event, breakpoints = "mb 375 · tab 768 · dt 1024 · wd 1440", children }) {
  return (
    <section id={id} className="lp-section anno-section">
      <div className="anno anno-section-band">
        <span className="num">{n}</span>
        <span>§{n} {name}</span>
        <span className="file">{file}</span>
        {event ? <span className="event">{event}</span> : null}
      </div>
      <div className="anno bp-badge">
        Container <span className="v">max-w-3xl</span> · <span className="v">{breakpoints}</span>
      </div>
      {children}
    </section>
  );
}

Object.assign(window, {
  useInView,
  Reveal,
  Eyebrow,
  Anno,
  AnnoSpec,
  AssetSlot,
  EarningsDisclaimer,
  Section,
});
