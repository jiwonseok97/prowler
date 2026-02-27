import { getThreatScore } from "@/actions/overview";

import { pickFilterParams } from "../_lib/filter-params";
import { getRegionFilter, pickPipelineSummary } from "../_lib/pipeline-summary";
import { SSRComponentProps } from "../_types";
import { ThreatScore } from "./_components/threat-score";

export const ThreatScoreSSR = async ({
  searchParams,
  pipelineState,
}: SSRComponentProps) => {
  const filters = pickFilterParams(searchParams);
  const targetRegion = getRegionFilter(searchParams);
  const pipelineSummary = pickPipelineSummary(pipelineState, targetRegion);

  if (pipelineSummary?.threat_score !== undefined) {
    return (
      <ThreatScore
        score={pipelineSummary.threat_score ?? undefined}
        scoreDelta={pipelineSummary.threat_score_delta ?? null}
      />
    );
  }

  const threatScoreData = await getThreatScore({ filters });

  // If no data, pass undefined score and let component handle empty state
  if (!threatScoreData?.data || threatScoreData.data.length === 0) {
    return <ThreatScore />;
  }

  // Get the first snapshot (aggregated or single provider)
  const snapshot = threatScoreData.data[0];
  const attributes = snapshot.attributes;

  // Parse score from decimal string to number
  const score = parseFloat(attributes.overall_score);
  const scoreDelta = attributes.score_delta
    ? parseFloat(attributes.score_delta)
    : null;

  return (
    <ThreatScore
      score={score}
      scoreDelta={scoreDelta}
      sectionScores={attributes.section_scores}
      criticalRequirements={attributes.critical_requirements}
    />
  );
};
