import MarketingHeader from "./MarketingHeader";
import MarketingFooter from "./MarketingFooter";

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <div className="min-h-[60vh]">{children}</div>
      <MarketingFooter />
    </>
  );
}
