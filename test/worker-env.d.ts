import type { Db } from "../worker/lib/users";

declare global {
  interface Env {
    ASSETS: { fetch(request: Request): Promise<Response> };
    DB: Db;
    SESSION_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_REDIRECT_URI: string;
  }
  var NativeRequest: typeof Request;
  var NativeResponse: typeof Response;
  var NativeHeaders: typeof Headers;
}
