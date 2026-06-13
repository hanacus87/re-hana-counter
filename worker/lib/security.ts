export function buildContentSecurityPolicy(isDev: boolean): string {
  const base =
    "default-src 'self'; object-src 'none'; frame-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";
  if (!isDev) {
    return base;
  }
  return `${base}; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:; img-src 'self' data:`;
}
