import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://momfluence.app"),
  title: {
    default: "MomFluence — Curated brand partnerships for Moms",
    template: "%s | MomFluence",
  },
  description:
    "MomFluence is a curated brand partnership platform for Moms. Hand-picked, pre-vetted offers. Share your link. Get paid NET-30 by direct deposit.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: "MomFluence",
    url: "https://momfluence.app",
    title: "MomFluence — Curated brand partnerships for Moms",
    description: "Hand-picked, pre-vetted offers. Share your link. Get paid.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MomFluence — Curated brand partnerships for Moms",
    description: "Hand-picked, pre-vetted offers. Share your link. Get paid.",
  },
};

const GA = process.env.NEXT_PUBLIC_GA4_ID;
const PIXEL_PRIMARY = "1468831514190648";
const PIXEL_LEGACY_CONTENT = "1407633647209853";
const PIXEL_LEGACY_SPA = "764587569626622";

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
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_PRIMARY}');
          fbq('init', '${PIXEL_LEGACY_CONTENT}');
          fbq('init', '${PIXEL_LEGACY_SPA}');
          fbq('track', 'PageView');
        `}</Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{ display: "none" }} alt=""
            src={`https://www.facebook.com/tr?id=${PIXEL_PRIMARY}&ev=PageView&noscript=1`} />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
