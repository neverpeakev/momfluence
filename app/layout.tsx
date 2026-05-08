import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://momfluence.app"),
  title: {
    default: "Moms: have $5 + friends? — MomFluence.app",
    template: "%s — MomFluence.app"
  },
  description:
    "Get paid for the stuff you're already sharing. Real brands, real commissions, paid right to your phone. $5/mo, cancel anytime.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: "MomFluence",
    title: "Moms: have $5 + friends? — MomFluence.app",
    description:
      "Get paid for the stuff you're already sharing. Real brands, real commissions, paid right to your phone.",
    url: "https://momfluence.app",
    images: ["/og-default.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Moms: have $5 + friends? — MomFluence.app",
    description:
      "Get paid for the stuff you're already sharing. Real brands, real commissions.",
    images: ["/og-default.png"]
  }
};

const GA = process.env.NEXT_PUBLIC_GA4_ID;
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap"
          rel="stylesheet"
        />
        {GA && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA}');
            `}</Script>
          </>
        )}
        {PIXEL && (
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL}');
            fbq('track', 'PageView');
          `}</Script>
        )}
      </head>
      <body className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
