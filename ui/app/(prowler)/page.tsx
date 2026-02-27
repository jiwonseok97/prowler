import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import {
  getPipelinePublishLatestState,
} from "@/actions/pipeline-publish/pipeline-publish";
import { getProviders } from "@/actions/providers";
import { ContentLayout } from "@/components/ui";
import { SearchParamsProps } from "@/types";

import { ensureRegionFilter } from "./_overview/_lib/ensure-region-filter";
import { AccountsSelector } from "./_overview/_components/accounts-selector";
import { PipelineLatestUploadBadge } from "./_overview/_components/pipeline-latest-upload-badge";
import { ProviderTypeSelector } from "./_overview/_components/provider-type-selector";
import {
  AttackSurfaceSkeleton,
  AttackSurfaceSSR,
} from "./_overview/attack-surface";
import { CheckFindingsSSR } from "./_overview/check-findings";
import { GraphsTabsWrapper } from "./_overview/graphs-tabs/graphs-tabs-wrapper";
import { RiskPipelineViewSkeleton } from "./_overview/graphs-tabs/risk-pipeline-view";
import {
  ResourcesInventorySkeleton,
  ResourcesInventorySSR,
} from "./_overview/resources-inventory";
import {
  RiskSeverityChartSkeleton,
  RiskSeverityChartSSR,
} from "./_overview/risk-severity";
import {
  FindingSeverityOverTimeSkeleton,
  FindingSeverityOverTimeSSR,
} from "./_overview/severity-over-time/finding-severity-over-time.ssr";
import { StatusChartSkeleton } from "./_overview/status-chart";
import { ThreatScoreSkeleton, ThreatScoreSSR } from "./_overview/threat-score";
import {
  ComplianceWatchlistSSR,
  ServiceWatchlistSSR,
  WatchlistCardSkeleton,
} from "./_overview/watchlist";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations("overview");
  const providersData = await getProviders({ page: 1, pageSize: 200 });
  const pipelinePublishState = await getPipelinePublishLatestState();
  const latestPipelineUpload = pipelinePublishState?.latestUpload;
  const DEFAULT_REGION = "ap-northeast-2";

  // Auto-inject pipeline account filter when the user has not manually selected
  // a provider. This ensures overview widgets default to pipeline results.
  const hasUserFilter =
    resolvedSearchParams?.["filter[provider_id__in]"] ||
    resolvedSearchParams?.["filter[provider_type__in]"];

  // Fall back to baseline_scan account_id when the latest event (rescan_verify) has an empty one
  const pipelineAccountId =
    latestPipelineUpload?.meta?.account_id ||
    pipelinePublishState?.events?.["baseline_scan"]?.meta?.account_id;
  const targetRegion = DEFAULT_REGION;
  const pipelineProviderId = pipelineAccountId
    ? (providersData?.data ?? []).find(
        (p) => p.attributes.uid === pipelineAccountId,
      )?.id
    : undefined;

  const baseSearchParams: SearchParamsProps =
    !hasUserFilter && pipelineProviderId
      ? {
          ...resolvedSearchParams,
          "filter[provider_id__in]": pipelineProviderId,
          "filter[provider_type__in]": "aws",
        }
      : (resolvedSearchParams ?? {});
  const effectiveSearchParams = ensureRegionFilter(
    baseSearchParams,
    targetRegion,
  );

  return (
    <ContentLayout title={t("title")} icon="lucide:square-chart-gantt">
      <div className="mb-3 flex justify-end">
        <PipelineLatestUploadBadge latestUpload={latestPipelineUpload} />
      </div>

      <div className="xxl:grid-cols-4 mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <ProviderTypeSelector providers={providersData?.data ?? []} />
        <AccountsSelector providers={providersData?.data ?? []} />
      </div>

      <div className="flex flex-col gap-6 xl:flex-row xl:flex-wrap xl:items-stretch">
        <Suspense fallback={<ThreatScoreSkeleton />}>
          <ThreatScoreSSR
            searchParams={effectiveSearchParams}
            pipelineState={pipelinePublishState}
          />
        </Suspense>

        <Suspense fallback={<StatusChartSkeleton />}>
          <CheckFindingsSSR
            searchParams={effectiveSearchParams}
            pipelineState={pipelinePublishState}
          />
        </Suspense>

        <Suspense fallback={<RiskSeverityChartSkeleton />}>
          <RiskSeverityChartSSR
            searchParams={effectiveSearchParams}
            pipelineState={pipelinePublishState}
          />
        </Suspense>
      </div>

      <div className="mt-6">
        <Suspense fallback={<ResourcesInventorySkeleton />}>
          <ResourcesInventorySSR
            searchParams={effectiveSearchParams}
            pipelineState={pipelinePublishState}
          />
        </Suspense>
      </div>

      <div className="mt-6 flex flex-col gap-6 xl:flex-row">
        <div className="flex min-w-0 flex-col gap-6 overflow-hidden sm:flex-row sm:flex-wrap sm:items-stretch xl:w-[312px] xl:shrink-0 xl:flex-col">
          <div className="min-w-0 sm:flex-1 xl:flex-auto [&>*]:h-full">
            <Suspense fallback={<WatchlistCardSkeleton />}>
              <ComplianceWatchlistSSR searchParams={effectiveSearchParams} />
            </Suspense>
          </div>
          <div className="min-w-0 sm:flex-1 xl:flex-auto [&>*]:h-full">
            <Suspense fallback={<WatchlistCardSkeleton />}>
              <ServiceWatchlistSSR searchParams={effectiveSearchParams} />
            </Suspense>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6">
          <Suspense fallback={<AttackSurfaceSkeleton />}>
            <AttackSurfaceSSR searchParams={effectiveSearchParams} />
          </Suspense>
          <Suspense fallback={<FindingSeverityOverTimeSkeleton />}>
            <FindingSeverityOverTimeSSR searchParams={effectiveSearchParams} />
          </Suspense>
        </div>
      </div>

      <div className="mt-6">
        <Suspense fallback={<RiskPipelineViewSkeleton />}>
          <GraphsTabsWrapper searchParams={effectiveSearchParams} />
        </Suspense>
      </div>
    </ContentLayout>
  );
}
