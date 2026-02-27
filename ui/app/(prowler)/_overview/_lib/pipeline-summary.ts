import type {
  PipelineLatestUpload,
  PipelinePublishLatestState,
  PipelineSummaryFindingsStatus,
  PipelineSummaryResourceInventoryItem,
  PipelineSummarySeverity,
} from "@/actions/pipeline-publish/pipeline-publish";
import type { SearchParamsProps } from "@/types";

export interface PipelineSummaryPayload {
  threat_score?: number | null;
  threat_score_delta?: number | null;
  findings_status?: PipelineSummaryFindingsStatus;
  severity?: PipelineSummarySeverity;
  resource_inventory?: PipelineSummaryResourceInventoryItem[];
}

const normalizeRegion = (value?: string) => (value || "").trim();

const uploadMatchesRegion = (upload?: PipelineLatestUpload, region?: string) => {
  if (!upload || !region) return false;
  return normalizeRegion(upload.meta?.region) === normalizeRegion(region);
};

export const getRegionFilter = (params?: SearchParamsProps | null) => {
  const value = params?.["filter[region__in]"];
  if (!value) return "";
  if (Array.isArray(value)) return value[0] || "";
  return value.split(",")[0].trim();
};

export const pickPipelineSummary = (
  state: PipelinePublishLatestState | undefined,
  region: string,
): PipelineSummaryPayload | undefined => {
  if (!state) return undefined;
  const latest = state.latestUpload;
  if (uploadMatchesRegion(latest, region)) {
    return latest?.summary as PipelineSummaryPayload | undefined;
  }

  const baseline = state.events?.baseline_scan;
  if (uploadMatchesRegion(baseline, region)) {
    return baseline?.summary as PipelineSummaryPayload | undefined;
  }

  const rescan = state.events?.rescan_verify ?? state.events?.rescan;
  if (uploadMatchesRegion(rescan, region)) {
    return rescan?.summary as PipelineSummaryPayload | undefined;
  }

  return undefined;
};
