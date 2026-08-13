import { describe, expect, it } from "vitest";

import { dictionaries } from "@/i18n/dictionaries";

describe("translation dictionaries", () => {
  it("keeps English and Khmer translation keys in sync", () => {
    expect(Object.keys(dictionaries.km).sort()).toEqual(Object.keys(dictionaries.en).sort());
  });
});
