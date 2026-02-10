'use client'

/**
 * MarketingScripts — Analytics & Tracking (Standalone Only)
 *
 * Renders Facebook Pixel and Google Analytics scripts ONLY in standalone mode.
 * These scripts must NOT load inside the Shopify Admin iframe because:
 *  - They track Akeed marketing visitors, not Shopify merchants
 *  - They add unnecessary network overhead in embedded mode
 *  - They may interfere with Shopify's Content Security Policy
 */

import Script from 'next/script'
import { useAkeedMode } from '@/hooks/useAkeedMode'

export function MarketingScripts() {
  const { isStandalone } = useAkeedMode()

  // Don't load marketing scripts in Shopify embedded mode
  if (!isStandalone) return null

  return (
    <>
      {/* Meta Pixel Code */}
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '2079384036148209');
          fbq('track', 'PageView');
        `}
      </Script>

      {/* Google tag (gtag.js) */}
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-J7EM70ZQS0"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-J7EM70ZQS0');
        `}
      </Script>
    </>
  )
}
