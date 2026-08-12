import { describe, expect, it } from "vitest";

import { parseFacebookSettings, parseGraphApiVersion } from "@/domain/facebook";

describe("Facebook boundaries", () => {
  it("parses Page settings and checkbox state", () => {
    expect(parseFacebookSettings({ pageAccessToken: "a-valid-facebook-page-token", pageId: "123456", pageName: " Demo ", captionTemplate: " {name} ", isEnabled: "on" })).toEqual({ pageAccessToken: "a-valid-facebook-page-token", pageId: "123456", pageName: "Demo", captionTemplate: "{name}", isEnabled: true });
  });

  it("rejects non-numeric Page IDs", () => {
    expect(() => parseFacebookSettings({ pageAccessToken: "a-valid-facebook-page-token", pageId: "@demo", isEnabled: false })).toThrow("numbers only");
  });

  it("requires an explicit supported-looking Graph API version", () => {
    expect(parseGraphApiVersion("v24.0")).toBe("v24.0");
    expect(() => parseGraphApiVersion(undefined)).toThrow("META_GRAPH_API_VERSION");
  });
});
