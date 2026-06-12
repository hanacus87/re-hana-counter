declare global {
  interface Env {
    ASSETS: { fetch(request: Request): Promise<Response> };
  }
}

export {};
