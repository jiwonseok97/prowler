import type {
  PipelineLatestUpload,
  PipelinePublishLatestState,
} from "@/actions/pipeline-publish/pipeline-publish";
import { Badge, Card, CardContent, CardTitle } from "@/components/shadcn";

const SEOUL_REGION = "ap-northeast-2";

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
};

const isTargetRegion = (upload?: PipelineLatestUpload, region = SEOUL_REGION) =>
  !!upload && (upload.meta?.region || "").trim() === region;

const MetricCell = ({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) => (
  <div className="border-border-neutral-tertiary bg-bg-neutral-tertiary rounded-lg border px-3 py-2">
    <div className="text-text-neutral-tertiary text-[11px] uppercase tracking-wide">
      {label}
    </div>
    <div className="text-text-neutral-primary mt-1 text-sm font-semibold">
      {value ?? "-"}
    </div>
  </div>
);

const EventRow = ({
  title,
  upload,
  emptyText,
}: {
  title: string;
  upload?: PipelineLatestUpload;
  emptyText: string;
}) => {
  if (!upload) {
    return (
      <div className="border-border-neutral-tertiary bg-bg-neutral-tertiary/40 rounded-lg border px-4 py-3">
        <div className="text-text-neutral-primary text-sm font-medium">{title}</div>
        <div className="text-text-neutral-tertiary mt-1 text-xs">{emptyText}</div>
      </div>
    );
  }

  return (
    <div className="border-border-neutral-tertiary rounded-lg border px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-text-neutral-primary text-sm font-semibold">
          {title}
        </div>
        <Badge variant="tag" className="text-[11px]">
          Run #{upload.meta?.run_id || "-"}
        </Badge>
      </div>

      <div className="text-text-neutral-tertiary mt-2 text-xs">
        {formatDateTime(upload.received_at)}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCell
          label="기준 위반 수"
          value={upload.summary?.baseline_fail}
        />
        <MetricCell label="재스캔 위반 수" value={upload.summary?.post_fail} />
        <MetricCell label="감소된 항목" value={upload.summary?.reduced} />
        <MetricCell label="AWS 계정" value={upload.meta?.account_id || "-"} />
      </div>
    </div>
  );
};

export const PipelineLatestSummaryCard = ({
  pipelineState,
  targetRegion = SEOUL_REGION,
}: {
  pipelineState?: PipelinePublishLatestState;
  targetRegion?: string;
}) => {
  const latestUpload = pipelineState?.latestUpload;
  const events = pipelineState?.events;
  const latestMatchesTarget = isTargetRegion(latestUpload, targetRegion);
  const baselineUpload = isTargetRegion(events?.baseline_scan, targetRegion)
    ? events?.baseline_scan
    : undefined;
  const rescanUpload = isTargetRegion(
    events?.rescan_verify ?? events?.rescan,
    targetRegion,
  )
    ? (events?.rescan_verify ?? events?.rescan)
    : undefined;

  return (
    <Card variant="base" className="w-full">
      <CardTitle className="flex flex-wrap items-center gap-2">
        <span>파이프라인 최신 현황</span>
        <Badge variant="tag" className="text-[11px]">
          서울 ({targetRegion})
        </Badge>
      </CardTitle>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="border-emerald-400/40">
            {"스캔 실행 → 파이프라인 업로드"}
          </Badge>
          {latestUpload ? (
            <span className="text-text-neutral-tertiary">
              최신 업로드: {formatDateTime(latestUpload.received_at)}
            </span>
          ) : (
            <span className="text-text-neutral-tertiary">
              파이프라인 업로드 없음
            </span>
          )}
        </div>

        {!latestMatchesTarget && latestUpload ? (
          <div className="border-border-warning bg-bg-warning/10 text-text-neutral-secondary rounded-lg border px-3 py-2 text-xs">
            최신 페이로드 리전: `{latestUpload.meta?.region || "-"}` —
            이 카드는 `{targetRegion}` 리전만 표시합니다.
          </div>
        ) : null}

        <EventRow
          title="① 기준 스캔 (Baseline)"
          upload={baselineUpload}
          emptyText="서울 리전 기준 스캔 결과가 없습니다."
        />

        <EventRow
          title="④ 취약점 감소 검증 (Re-scan)"
          upload={rescanUpload}
          emptyText="서울 리전 재스캔 / 검증 결과가 없습니다."
        />
      </CardContent>
    </Card>
  );
};
