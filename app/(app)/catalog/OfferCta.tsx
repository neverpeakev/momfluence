import Link from "next/link";
import GetLinkButton from "./GetLinkButton";
import CopyLinkButton from "./CopyLinkButton";

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "withdrawn";

type Props = {
  offerId: string;
  offerSlug: string;
  accessModel: "open" | "application_required";
  destinationUrl: string | null;
  applicationStatus: ApplicationStatus | null;
};

const DISABLED_LABELS: Record<Exclude<ApplicationStatus, "approved">, string> = {
  pending: "Application pending",
  rejected: "Not approved",
  waitlisted: "On waitlist",
  withdrawn: "Application withdrawn"
};

const DISABLED_CLASSES: Record<Exclude<ApplicationStatus, "approved">, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  waitlisted: "bg-stone-100 text-stone-700 border-stone-200",
  withdrawn: "bg-stone-100 text-stone-500 border-stone-200"
};

export default function OfferCta({
  offerId,
  offerSlug,
  accessModel,
  destinationUrl,
  applicationStatus
}: Props) {
  if (accessModel === "open") {
    return destinationUrl ? (
      <CopyLinkButton destinationUrl={destinationUrl} />
    ) : (
      <GetLinkButton offerId={offerId} />
    );
  }

  if (!applicationStatus) {
    return (
      <Link href={`/catalog/${offerSlug}/apply`} className="btn-primary w-full">
        Apply
      </Link>
    );
  }

  if (applicationStatus === "approved") {
    return destinationUrl ? (
      <CopyLinkButton destinationUrl={destinationUrl} />
    ) : (
      <GetLinkButton offerId={offerId} />
    );
  }

  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className={`w-full inline-flex items-center justify-center rounded-xl border px-5 py-3 font-semibold cursor-not-allowed ${DISABLED_CLASSES[applicationStatus]}`}
    >
      {DISABLED_LABELS[applicationStatus]}
    </button>
  );
}
