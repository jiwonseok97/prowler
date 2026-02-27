import { describe, expect, it } from "vitest";

import { ensureRegionFilter } from "./ensure-region-filter";

describe("ensureRegionFilter", () => {
  it("adds a region filter when none is provided", () => {
    const result = ensureRegionFilter(undefined, "ap-northeast-2");

    expect(result["filter[region__in]"]).toBe("ap-northeast-2");
  });

  it("preserves an existing region filter", () => {
    const result = ensureRegionFilter(
      { "filter[region__in]": "us-east-1" },
      "ap-northeast-2",
    );

    expect(result["filter[region__in]"]).toBe("us-east-1");
  });
});
