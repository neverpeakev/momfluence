/**
 * Inline earnings disclaimer.
 *
 * FTC compliance: every concrete earnings example on a marketing page
 * needs a clear, conspicuous disclaimer that results are not typical
 * and individual results vary. This is a small reusable component that
 * sits adjacent to any earnings figure ("$340 in a week," "$2.40/mo
 * recurring," etc.).
 *
 * Don't use the * symbol alone — courts have found asterisk-only
 * footnotes inadequate. We include a brief inline explainer and a link
 * to the full earnings disclaimer page.
 *
 * Two density levels:
 *   "full"  — small block, ~2 lines, suitable for hero earnings claims
 *   "compact" — single sub-line, suitable for example cards
 */
import Link from "next/link";

interface Props {
  density?: "full" | "compact";
  className?: string;
}

export default function EarningsDisclaimerInline({ density = "compact", className = "" }: Props) {
  if (density === "compact") {
    return (
      <p className={`text-xs text-navy-500 ${className}`}>
        Example. Individual results vary.{" "}
        <Link href="/disclosures/earnings" className="underline">
          See earnings disclaimer
        </Link>
        .
      </p>
    );
  }

  return (
    <div className={`rounded-lg bg-navy-50 px-4 py-3 text-xs text-navy-600 ring-1 ring-navy-100 ${className}`}>
      <p>
        <span className="font-semibold text-navy-700">Earnings disclaimer:</span>{" "}
        Figures shown are illustrative examples, not guarantees. Actual earnings depend
        on how often you share, who you share with, and which brand programs you use.
        Most new members earn less in the first 30 days than in subsequent months as
        their links accumulate clicks.{" "}
        <Link href="/disclosures/earnings" className="underline">
          Read the full disclaimer
        </Link>
        .
      </p>
    </div>
  );
}
