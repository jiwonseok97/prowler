import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getLighthouseProvidersConfig,
  isLighthouseConfigured,
} from "@/actions/lighthouse/lighthouse";
import { LighthouseIcon } from "@/components/icons/Icons";
import { Chat } from "@/components/lighthouse";
import { ContentLayout } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AIChatbot() {
  const hasConfig = await isLighthouseConfigured();

  if (!hasConfig) {
    return redirect("/lighthouse/config");
  }

  // Fetch provider configuration with default models
  const providersConfig = await getLighthouseProvidersConfig();

  // Handle errors or missing configuration
  if (providersConfig.errors || !providersConfig.providers) {
    return redirect("/lighthouse/config");
  }

  return (
    <ContentLayout title="Lighthouse AI" icon={<LighthouseIcon />}>
      <div className="border-border-neutral-secondary bg-bg-neutral-secondary/40 mb-4 flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm">
        <div className="font-semibold">Lighthouse AI DP</div>
        <div className="text-text-neutral-tertiary">
          Finding 해석과 우선순위 결정을 돕는 대화형 분석 도우미입니다.
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            href="https://communities-graph-students-claims.trycloudflare.com/profile"
            target="_blank"
            rel="noreferrer"
            className="text-text-brand hover:underline"
          >
            DP 페이지 바로가기
          </Link>
        </div>
        <ul className="text-text-neutral-secondary list-disc pl-5 text-xs">
          <li>Finding 해석 시간 단축: FAIL 원인과 우선 조치 리소스 요약</li>
          <li>우선순위 보조: 영향도 높은 항목부터 정리</li>
          <li>팀 커뮤니케이션 개선: 설명문/리포트 초안 자동화</li>
        </ul>
      </div>

      <div className="-mx-6 -my-4 h-[calc(100dvh-4.5rem)] sm:-mx-8">
        <Chat
          hasConfig={hasConfig}
          providers={providersConfig.providers}
          defaultProviderId={providersConfig.defaultProviderId}
          defaultModelId={providersConfig.defaultModelId}
        />
      </div>
    </ContentLayout>
  );
}
