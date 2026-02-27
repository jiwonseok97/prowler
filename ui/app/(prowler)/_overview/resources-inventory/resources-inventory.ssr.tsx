import {
  adaptResourceGroupOverview,
  adaptPipelineResourceInventory,
  getResourceGroupOverview,
} from "@/actions/overview";

import { pickFilterParams } from "../_lib/filter-params";
import { getRegionFilter, pickPipelineSummary } from "../_lib/pipeline-summary";
import { SSRComponentProps } from "../_types";
import { ResourcesInventory } from "./_components/resources-inventory";

export const ResourcesInventorySSR = async ({
  searchParams,
  pipelineState,
}: SSRComponentProps) => {
  const filters = pickFilterParams(searchParams);
  const targetRegion = getRegionFilter(searchParams);
  const pipelineSummary = pickPipelineSummary(pipelineState, targetRegion);

  if (pipelineSummary?.resource_inventory) {
    const items = adaptPipelineResourceInventory(
      pipelineSummary.resource_inventory,
    );
    return <ResourcesInventory items={items} filters={filters} />;
  }

  const response = await getResourceGroupOverview({ filters });

  const items = adaptResourceGroupOverview(response);

  return <ResourcesInventory items={items} filters={filters} />;
};
