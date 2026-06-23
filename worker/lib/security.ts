export function buildContentSecurityPolicy(isDev: boolean): string {
  const base =
    "default-src 'self'; object-src 'none'; frame-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";
  if (!isDev) {
    return base;
  }
  return `${base}; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:; img-src 'self' data:`;
}

const PERMISSIONS_POLICY =
  "accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(self), usb=(), web-share=(), xr-spatial-tracking=(), clipboard-read=(), clipboard-write=(), gamepad=(), hid=(), idle-detection=(), interest-cohort=(), serial=(), unload=()";

const baseSecurityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": PERMISSIONS_POLICY,
  "X-Permitted-Cross-Domain-Policies": "none",
  "X-DNS-Prefetch-Control": "off",
};

export function buildSecurityHeaders(isDev: boolean): Record<string, string> {
  return {
    "Content-Security-Policy": buildContentSecurityPolicy(isDev),
    ...baseSecurityHeaders,
  };
}

export function applySecurityHeaders(target: Headers, isDev: boolean): void {
  for (const [name, value] of Object.entries(buildSecurityHeaders(isDev))) {
    target.set(name, value);
  }
}

export function isSameOrigin(
  requestUrl: string,
  secFetchSite: string | undefined,
  origin: string | undefined,
): boolean {
  const requestOrigin = new URL(requestUrl).origin;
  return secFetchSite === "same-origin" || origin === requestOrigin;
}
