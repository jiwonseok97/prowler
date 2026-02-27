"use client";

import { useTranslations } from "next-intl";

import type { PipelineLatestUpload } from "@/actions/pipeline-publish/pipeline-publish";

const formatDateTime = (value?: string) => {
  if (!value) return "";
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

export const PipelineLatestUploadBadge = ({
  latestUpload,
}: {
  latestUpload?: PipelineLatestUpload;
}) => {
  const t = useTranslations("overview.pipelineUpload");

  if (!latestUpload) {
    return (
      <div className="rounded-md border border-dashed border-gray-700 bg-transparent px-3 py-2 text-right text-xs text-gray-400">
        {t("none")}
      </div>
    );
  }

  const eventLabel =
    latestUpload.meta?.event === "rescan_verify" ||
    latestUpload.meta?.event === "rescan"
      ? t("rescan")
      : latestUpload.meta?.event === "baseline_scan"
        ? t("baseline")
        : t("pipeline");

  return (
    <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-right text-xs leading-5">
      <div className="font-medium text-emerald-300">
        {eventLabel} · {t("latestUpload")}
      </div>
      <div className="text-gray-200">
        {formatDateTime(latestUpload.received_at) || t("noHistory")}
      </div>
      <div className="text-gray-400">
        run #{latestUpload.meta?.run_id || "-"}
        {typeof latestUpload.summary?.reduced === "number"
          ? ` · ${t("reduced")} ${latestUpload.summary.reduced}`
          : ""}
      </div>
    </div>
  );
};
