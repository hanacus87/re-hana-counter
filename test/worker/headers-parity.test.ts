/**
 * セキュリティヘッダーの一貫性
 *
 * 静的アセットは public/_headers、Worker 応答は worker/lib/security.ts で
 * それぞれ CSP を付与する。2か所の本番 CSP がドリフトしないことを固定する。
 */
import { describe, expect, test } from "bun:test";
import { buildContentSecurityPolicy } from "../../worker/lib/security";

describe("public/_headers と本番 CSP の一致", () => {
  test("_headers の Content-Security-Policy 行が本番 CSP を含む", async () => {
    const headers = await Bun.file("public/_headers").text();
    expect(headers).toContain(buildContentSecurityPolicy(false));
  });
});
