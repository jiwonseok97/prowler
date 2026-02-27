"use client";

import { Bell, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { DonutChart } from "@/components/graphs/donut-chart";
import { DonutDataPoint } from "@/components/graphs/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardVariant,
  ResourceStatsCard,
} from "@/components/shadcn";
import { calculatePercentage } from "@/lib/utils";
interface FindingsData {
  total: number;
  new: number;
}

interface StatusChartProps {
  failFindingsData: FindingsData;
  passFindingsData: FindingsData;
}

export const StatusChart = ({
  failFindingsData,
  passFindingsData,
}: StatusChartProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Calculate total from displayed findings (fail + pass)
  const totalFindings = failFindingsData.total + passFindingsData.total;

  const handleSegmentClick = (dataPoint: DonutDataPoint) => {
    // Build the URL with current filters plus status and muted
    const params = new URLSearchParams(searchParams.toString());

    // Add status filter based on which segment was clicked
    if (dataPoint.name === "실패 결과") {
      params.set("filter[status__in]", "FAIL");
    } else if (dataPoint.name === "통과 결과") {
      params.set("filter[status__in]", "PASS");
    }

    // Add exclude muted findings filter
    params.set("filter[muted]", "false");

    // Navigate to findings page
    router.push(`/findings?${params.toString()}`);
  };

  // Calculate percentages
  const failPercentage = calculatePercentage(
    failFindingsData.total,
    totalFindings,
  );
  const passPercentage = calculatePercentage(
    passFindingsData.total,
    totalFindings,
  );

  // Calculate change percentages (new findings as percentage change)
  const failChange = calculatePercentage(
    failFindingsData.new,
    failFindingsData.total,
  );
  const passChange = calculatePercentage(
    passFindingsData.new,
    passFindingsData.total,
  );

  // Mock data for DonutChart
  const donutData: DonutDataPoint[] = [
    {
      name: "실패 결과",
      value: failFindingsData.total,
      color: "var(--bg-fail-primary)",
      percentage: Number(failPercentage),
      change: Number(failChange),
    },
    {
      name: "통과 결과",
      value: passFindingsData.total,
      color: "var(--bg-pass-primary)",
      percentage: Number(passPercentage),
      change: Number(passChange),
    },
  ];

  return (
    <Card
      variant="base"
      className="flex min-h-[372px] min-w-[312px] flex-1 flex-col justify-between md:min-w-[380px]"
    >
      <CardHeader>
        <CardTitle>점검 결과 현황</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between space-y-4">
        <div className="mx-auto h-[172px] w-[172px]">
          <DonutChart
            data={donutData}
            showLegend={false}
            innerRadius={66}
            outerRadius={86}
            centerLabel={{
              value: totalFindings.toLocaleString(),
              label: "전체 결과",
            }}
            onSegmentClick={handleSegmentClick}
          />
        </div>

        <Card
          variant="inner"
          padding="md"
          className="flex w-full flex-col items-start justify-center gap-4 lg:flex-row lg:justify-between"
        >
          <ResourceStatsCard
            containerless
            badge={{
              icon: TriangleAlert,
              count: failFindingsData.total,
              variant: CardVariant.fail,
            }}
            label="실패 결과"
            stats={[{ icon: Bell, label: `${failFindingsData.new} 신규` }]}
            emptyState={
              failFindingsData.total === 0
                ? { message: "표시할 실패 결과가 없습니다" }
                : undefined
            }
            className="w-full lg:min-w-0 lg:flex-1"
          />

          <div className="flex w-full items-center justify-center lg:w-auto lg:self-stretch">
            <div className="bg-border-neutral-primary h-px w-full lg:h-full lg:w-px" />
          </div>

          <ResourceStatsCard
            containerless
            badge={{
              icon: ShieldCheck,
              count: passFindingsData.total,
              variant: CardVariant.pass,
            }}
            label="통과 결과"
            stats={[{ icon: Bell, label: `${passFindingsData.new} 신규` }]}
            emptyState={
              passFindingsData.total === 0
                ? { message: "표시할 통과 결과가 없습니다" }
                : undefined
            }
            className="w-full lg:min-w-0 lg:flex-1"
          />
        </Card>
      </CardContent>
    </Card>
  );
};
