import { describe, expect, it } from "vitest";

import {
  adaptPipelineResourceInventory,
  getEmptyResourceInventoryItems,
  RESOURCE_GROUP_IDS,
} from "./resources-inventory.adapter";

describe("adaptPipelineResourceInventory", () => {
  it("returns empty inventory when no pipeline data exists", () => {
    const items = adaptPipelineResourceInventory(undefined);

    expect(items).toEqual(getEmptyResourceInventoryItems());
  });

  it("merges pipeline summary values into known groups", () => {
    const items = adaptPipelineResourceInventory([
      {
        id: RESOURCE_GROUP_IDS.STORAGE,
        resources_count: 12,
        total_findings: 20,
        failed_findings: 10,
        new_failed_findings: 2,
        severity: {
          critical: 1,
          high: 2,
          medium: 3,
          low: 4,
          informational: 0,
        },
      },
    ]);

    const storage = items.find((item) => item.id === RESOURCE_GROUP_IDS.STORAGE);

    expect(storage?.totalResources).toBe(12);
    expect(storage?.failedFindings).toBe(10);
    expect(storage?.severity.critical).toBe(1);
  });
});
