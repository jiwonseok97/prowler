"use server";

import { apiBaseUrl } from "@/lib";

export interface PipelineLatestUpload {
  received_at?: string;
  meta?: {
    event?: string;
    repo?: string;
    run_id?: string;
    account_id?: string;
    region?: string;
    framework?: string;
  };
  summary?: {
    baseline_fail?: number;
    post_fail?: number;
    reduced?: number;
    post_fail_remediable?: number;
    post_fail_manual_runbook?: number;
    threat_score?: number;
    threat_score_delta?: number;
    findings_status?: PipelineSummaryFindingsStatus;
    severity?: PipelineSummarySeverity;
    resource_inventory?: PipelineSummaryResourceInventoryItem[];
  };
}

export interface PipelineSummaryFindingsStatus {
  fail: number;
  pass: number;
  fail_new: number;
  pass_new: number;
}

export interface PipelineSummarySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
}

export interface PipelineSummaryResourceInventoryItem {
  id: string;
  resources_count: number;
  total_findings: number;
  failed_findings: number;
  new_failed_findings: number;
  severity: PipelineSummarySeverity;
}

export interface PipelinePublishLatestState {
  latestUpload?: PipelineLatestUpload;
  events?: Record<string, PipelineLatestUpload | undefined>;
}

export const getPipelinePublishLatestState = async (): Promise<
  PipelinePublishLatestState | undefined
> => {
  if (!apiBaseUrl) return undefined;

  try {
    const response = await fetch(`${apiBaseUrl}/pipeline-publish/latest`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return undefined;
    const data = await response.json();
    const latestUpload = data?.latest_upload ?? data?.data?.latest_upload;
    const events = data?.events ?? data?.data?.events;
    return {
      latestUpload,
      events:
        events && typeof events === "object"
          ? (events as Record<string, PipelineLatestUpload | undefined>)
          : undefined,
    };
  } catch (error) {
    console.error("Error fetching latest pipeline upload:", error);
    return undefined;
  }
};

export const getLatestPipelineUpload = async (): Promise<
  PipelineLatestUpload | undefined
> => {
  const state = await getPipelinePublishLatestState();
  return state?.latestUpload;
};
