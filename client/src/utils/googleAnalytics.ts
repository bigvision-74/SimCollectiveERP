const GA_MEASUREMENT_ID = "G-R5YMMHDSRY";
const GA_SCRIPT_ID = "ga-gtag-script";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let loaded = false;

export function loadGoogleAnalytics() {
  if (loaded || document.getElementById(GA_SCRIPT_ID)) return;
  loaded = true;

  const script = document.createElement("script");
  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
}

function clearGoogleAnalyticsCookies() {
  const cookieNames = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((name) => /^_ga|^_gid|^_gat/.test(name));

  const hostParts = window.location.hostname.split(".");
  const domains = [
    window.location.hostname,
    hostParts.length > 1 ? `.${hostParts.slice(-2).join(".")}` : "",
  ].filter(Boolean);

  cookieNames.forEach((name) => {
    domains.forEach((domain) => {
      document.cookie = `${name}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
}

export function revokeGoogleAnalytics() {
  const script = document.getElementById(GA_SCRIPT_ID);
  script?.parentNode?.removeChild(script);
  loaded = false;
  clearGoogleAnalyticsCookies();
}
