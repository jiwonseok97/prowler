import { SearchParamsProps } from "@/types";

export const ensureRegionFilter = (
  params: SearchParamsProps | undefined | null,
  defaultRegion: string,
): SearchParamsProps => {
  const existing = params?.["filter[region__in]"];
  if (existing) {
    return params ?? {};
  }

  return {
    ...(params ?? {}),
    "filter[region__in]": defaultRegion,
  };
};
