/**
 * セキュリティヘッダーの一貫性
 *
 * 静的アセットは public/_headers、Worker 応答は worker/lib/security.ts で
 * それぞれ CSP を付与する。2か所の本番 CSP がドリフトしないことを固定する。
 */
import { describe, expect, test } from "bun:test";
import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from "../../worker/lib/security";

describe("public/_headers と本番 CSP の一致", () => {
  test("_headers の Content-Security-Policy 行が本番 CSP を含む", async () => {
    const headers = await Bun.file("public/_headers").text();
    expect(headers).toContain(buildContentSecurityPolicy(false));
  });

  test("Worker の本番セキュリティヘッダーの全ての値が _headers に含まれる", async () => {
    const headers = await Bun.file("public/_headers").text();
    for (const value of Object.values(buildSecurityHeaders(false))) {
      expect(headers).toContain(value);
    }
  });
});
