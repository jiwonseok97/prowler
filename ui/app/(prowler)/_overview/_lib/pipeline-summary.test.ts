import { describe, expect, it } from "vitest";

import type { PipelinePublishLatestState } from "@/actions/pipeline-publish/pipeline-publish";

import { getRegionFilter, pickPipelineSummary } from "./pipeline-summary";

describe("pipeline summary helpers", () => {
  it("returns the region filter when present", () => {
    const region = getRegionFilter({ "filter[region__in]": "ap-northeast-2" });

    expect(region).toBe("ap-northeast-2");
  });

  it("picks the latest upload when region matches", () => {
    const state: PipelinePublishLatestState = {
      latestUpload: {
        meta: { region: "ap-northeast-2" },
        summary: { threat_score: 91 },
      },
      events: {
        baseline_scan: {
          meta: { region: "ap-northeast-2" },
          summary: { threat_score: 80 },
        },
      },
    };

    const summary = pickPipelineSummary(state, "ap-northeast-2");

    expect(summary?.threat_score).toBe(91);
  });

  it("falls back to baseline when latest region mismatches", () => {
    const state: PipelinePublishLatestState = {
      latestUpload: {
        meta: { region: "us-east-1" },
        summary: { threat_score: 91 },
      },
      events: {
        baseline_scan: {
          meta: { region: "ap-northeast-2" },
          summary: { threat_score: 80 },
        },
      },
    };

    const summary = pickPipelineSummary(state, "ap-northeast-2");

    expect(summary?.threat_score).toBe(80);
  });
});
