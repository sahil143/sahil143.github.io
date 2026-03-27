/**
 * Konflux Analytics - Standalone bundle for GitHub Pages
 *
 * GDPR-compliant cookie consent with Google Consent Mode v2 and Amplitude.
 * Can be used on both Docusaurus and Antora sites.
 *
 * Usage in Antora/HTML:
 *   <script src="/js/konflux-analytics.js"></script>
 *
 * Configuration via window globals (set BEFORE loading this script):
 *   window.KONFLUX_ANALYTICS_CONFIG = {
 *     gaId: 'G-XXXXXXXXXX',           // Optional: GA4 measurement ID
 *     amplitudeKey: 'your-api-key',    // Optional: Amplitude API key
 *     privacyUrl: '/privacy',          // Optional: Privacy policy URL
 *     debug: false                     // Optional: Enable debug logging
 *   };
 *
 * Or use environment-based defaults (reads from meta tags):
 *   <meta name="ga-measurement-id" content="G-XXXXXXXXXX">
 *   <meta name="amplitude-api-key" content="your-key">
 */

(function () {
  "use strict";

  // Configuration
  const config = window.KONFLUX_ANALYTICS_CONFIG || {};
  const gaId = config.gaId || getMeta("ga-measurement-id");
  const amplitudeKey = config.amplitudeKey || getMeta("amplitude-api-key");
  const privacyUrl =
    config.privacyUrl ||
    getMeta("privacy-policy-url") ||
    "https://www.redhat.com/en/about/privacy-policy";
  const debug = !!config.debug;
  const skipCss = !!config.skipCss; // Skip CSS if site already has it bundled

  // Helper: Get meta tag content
  function getMeta(name) {
    const meta = document.querySelector(`meta[name="${name}"]`);
    return meta ? meta.getAttribute("content") : null;
  }

  // Debug logging
  function log(msg, data) {
    if (debug) console.log("[Konflux Analytics]", msg, data || "");
  }

  // Google Consent Mode v2: Set defaults BEFORE gtag loads
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });

  log('Consent defaults set to "denied"');

  // Amplitude initialization (lazy-loaded)
  let amplitudeModule = null;
  async function initAmplitude() {
    if (!amplitudeKey) return;
    if (amplitudeModule) return;

    try {
      // Import Amplitude from CDN
      const { init, setOptOut } =
        await import("https://cdn.amplitude.com/libs/analytics-browser-2.11.3-min.js.gz");
      amplitudeModule = { init, setOptOut };

      init(amplitudeKey, undefined, {
        defaultTracking: {
          sessions: true,
          pageViews: true,
          formInteractions: false,
          fileDownloads: false,
        },
        optOut: true, // Start opted out
      });

      log("Amplitude initialized (opted out)");
    } catch (e) {
      console.error("[Konflux Analytics] Amplitude init failed:", e);
    }
  }

  // Update consent for GA4 and Amplitude
  function updateConsent(allowed) {
    log("Updating consent", { allowed });

    // Update Google Consent Mode
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: allowed ? "granted" : "denied",
        ad_storage: "denied", // Always deny ads
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }

    // Update Amplitude opt-out
    if (amplitudeModule && typeof amplitudeModule.setOptOut === "function") {
      try {
        amplitudeModule.setOptOut(!allowed);
      } catch (e) {
        console.error("[Konflux Analytics] Amplitude setOptOut failed:", e);
      }
    }
  }

  // Load vanilla-cookieconsent default CSS
  function loadCookieConsentCSS() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.css";

    // Insert at the beginning of <head> so site's custom CSS can override it
    const firstLink = document.head.querySelector('link[rel="stylesheet"]');
    if (firstLink) {
      document.head.insertBefore(link, firstLink);
    } else {
      document.head.prepend(link);
    }
  }

  // Initialize cookie consent
  async function initCookieConsent() {
    // Only load CSS if not already bundled by the site
    if (!skipCss) {
      loadCookieConsentCSS();
    }

    try {
      // Import vanilla-cookieconsent from CDN
      const CookieConsent =
        await import("https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.esm.js");

      CookieConsent.run({
        mode: "opt-in",
        autoShow: true,
        autoClearCookies: true,
        disablePageInteraction: true,
        hideFromBots: true,
        categories: {
          necessary: { enabled: true, readOnly: true },
          analytics: {},
        },
        language: {
          default: "en",
          translations: {
            en: {
              consentModal: {
                title: "We use cookies",
                description:
                  "We use cookies to improve your experience and analyze site traffic. You can choose to accept analytics cookies or reject non-essential cookies.",
                acceptAllBtn: "Accept all",
                acceptNecessaryBtn: "Reject all",
                showPreferencesBtn: "Manage preferences",
              },
              preferencesModal: {
                title: "Manage cookie preferences",
                acceptAllBtn: "Accept all",
                acceptNecessaryBtn: "Reject all",
                savePreferencesBtn: "Save preferences",
                closeIconLabel: "Close",
                sections: [
                  {
                    title: "Strictly necessary",
                    description:
                      "These cookies are essential for the site to function and cannot be disabled.",
                    linkedCategory: "necessary",
                  },
                  {
                    title: "Analytics",
                    description:
                      "These cookies help us understand how visitors use the site (e.g., Google Analytics, Amplitude).",
                    linkedCategory: "analytics",
                  },
                  {
                    title: "More information",
                    description: `For details, see our <a href="${privacyUrl}" target="_blank" rel="noopener">Privacy Statement</a>.`,
                  },
                ],
              },
            },
          },
        },
        guiOptions: {
          consentModal: {
            layout: "box inline",
            position: "bottom center",
            flipButtons: false,
          },
          preferencesModal: {
            layout: "box",
            position: "right",
          },
        },
        onFirstConsent: () => {
          const allowed = CookieConsent.acceptedCategory("analytics");
          updateConsent(allowed);
          log("First consent", { allowed });
        },
        onConsent: () => {
          const allowed = CookieConsent.acceptedCategory("analytics");
          updateConsent(allowed);
          log("Consent updated", { allowed });
        },
        onChange: () => {
          const allowed = CookieConsent.acceptedCategory("analytics");
          updateConsent(allowed);
          log("Preferences changed", { allowed });
        },
      });

      // Apply consent for returning visitors
      setTimeout(() => {
        const allowed = CookieConsent.acceptedCategory("analytics");
        updateConsent(allowed);
      }, 0);

      log("Cookie consent initialized");
    } catch (e) {
      console.error("[Konflux Analytics] Cookie consent init failed:", e);
    }
  }

  // Load Google Analytics gtag.js
  function loadGoogleAnalytics() {
    if (!gaId) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;

    script.onload = () => {
      window.gtag("js", new Date());
      window.gtag("config", gaId, {
        anonymize_ip: true,
      });
      log("Google Analytics loaded", { gaId });
    };

    document.head.appendChild(script);
  }

  // Initialize everything
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
      return;
    }

    log("Initializing", { gaId, amplitudeKey, privacyUrl });

    // Load GA4
    loadGoogleAnalytics();

    // Initialize Amplitude
    if (amplitudeKey) {
      initAmplitude();
    }

    // Initialize cookie consent
    initCookieConsent();

    if (!gaId && !amplitudeKey) {
      log(
        "No analytics configured (GA_MEASUREMENT_ID and AMPLITUDE_API_KEY not set)",
      );
    }
  }

  init();
})();
