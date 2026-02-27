"use client";

import { useSearchParams } from "next/navigation";
import { ReactNode } from "react";

import {
  AlibabaCloudProviderBadge,
  AWSProviderBadge,
  AzureProviderBadge,
  CloudflareProviderBadge,
  GCPProviderBadge,
  GitHubProviderBadge,
  IacProviderBadge,
  KS8ProviderBadge,
  M365ProviderBadge,
  MongoDBAtlasProviderBadge,
  OpenStackProviderBadge,
  OracleCloudProviderBadge,
} from "@/components/icons/providers-badge";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/shadcn/select/multiselect";
import { useUrlFilters } from "@/hooks/use-url-filters";
import type { ProviderProps, ProviderType } from "@/types/providers";

const PROVIDER_ICON: Record<ProviderType, ReactNode> = {
  aws: <AWSProviderBadge width={18} height={18} />,
  azure: <AzureProviderBadge width={18} height={18} />,
  gcp: <GCPProviderBadge width={18} height={18} />,
  kubernetes: <KS8ProviderBadge width={18} height={18} />,
  m365: <M365ProviderBadge width={18} height={18} />,
  github: <GitHubProviderBadge width={18} height={18} />,
  iac: <IacProviderBadge width={18} height={18} />,
  oraclecloud: <OracleCloudProviderBadge width={18} height={18} />,
  mongodbatlas: <MongoDBAtlasProviderBadge width={18} height={18} />,
  alibabacloud: <AlibabaCloudProviderBadge width={18} height={18} />,
  cloudflare: <CloudflareProviderBadge width={18} height={18} />,
  openstack: <OpenStackProviderBadge width={18} height={18} />,
};

interface AccountsSelectorProps {
  providers: ProviderProps[];
}

export function AccountsSelector({ providers }: AccountsSelectorProps) {
  const searchParams = useSearchParams();
  const { navigateWithParams } = useUrlFilters();

  const filterKey = "filter[provider_id__in]";
  const current = searchParams.get(filterKey) || "";
  const selectedTypes = searchParams.get("filter[provider_type__in]") || "";
  const selectedTypesList = selectedTypes
    ? selectedTypes.split(",").filter(Boolean)
    : [];
  const selectedIds = current ? current.split(",").filter(Boolean) : [];
  const visibleProviders = providers
    // .filter((p) => p.attributes.connection?.connected)
    .filter((p) =>
      selectedTypesList.length > 0
        ? selectedTypesList.includes(p.attributes.provider)
        : true,
    );

  const handleMultiValueChange = (ids: string[]) => {
    navigateWithParams((params) => {
      params.delete(filterKey);

      if (ids.length > 0) {
        params.set(filterKey, ids.join(","));
      }

      // Auto-deselect provider types that no longer have any selected accounts
      if (selectedTypesList.length > 0) {
        // Get provider types of currently selected accounts
        const selectedProviders = providers.filter((p) => ids.includes(p.id));
        const selectedProviderTypes = new Set(
          selectedProviders.map((p) => p.attributes.provider),
        );

        // Keep only provider types that still have selected accounts
        const remainingProviderTypes = selectedTypesList.filter((type) =>
          selectedProviderTypes.has(type as ProviderType),
        );

        // Update provider_type__in filter
        if (remainingProviderTypes.length > 0) {
          params.set(
            "filter[provider_type__in]",
            remainingProviderTypes.join(","),
          );
        } else {
          params.delete("filter[provider_type__in]");
        }
      }
    });
  };

  const selectedLabel = () => {
    if (selectedIds.length === 0) return null;
    if (selectedIds.length === 1) {
      const p = providers.find((pr) => pr.id === selectedIds[0]);
      const name = p ? p.attributes.alias || p.attributes.uid : selectedIds[0];
      return <span className="truncate">{name}</span>;
    }
    return (
      <span className="truncate">{selectedIds.length}개 계정 선택됨</span>
    );
  };

  const filterDescription =
    selectedTypesList.length > 0
      ? `선택한 제공자(${selectedTypesList.join(", ")})의 계정 표시`
      : "연결된 모든 클라우드 계정";

  return (
    <div className="relative">
      <label
        htmlFor="accounts-selector"
        className="sr-only"
        id="accounts-label"
      >
        클라우드 계정으로 필터링합니다. {filterDescription}. 하나 이상 선택해 결과를 확인하세요.
      </label>
      <MultiSelect values={selectedIds} onValuesChange={handleMultiValueChange}>
        <MultiSelectTrigger
          id="accounts-selector"
          aria-labelledby="accounts-label"
        >
          {selectedLabel() || <MultiSelectValue placeholder="전체 계정" />}
        </MultiSelectTrigger>
        <MultiSelectContent search={false}>
          {visibleProviders.length > 0 ? (
            <>
              <div
                role="option"
                aria-selected={selectedIds.length === 0}
                aria-label="전체 계정 선택 (현재 선택 해제)"
                tabIndex={0}
                className="text-text-neutral-secondary flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700/50"
                onClick={() => handleMultiValueChange([])}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleMultiValueChange([]);
                  }
                }}
              >
                전체 선택
              </div>
              {visibleProviders.map((p) => {
                const id = p.id;
                const displayName = p.attributes.alias || p.attributes.uid;
                const providerType = p.attributes.provider as ProviderType;
                const icon = PROVIDER_ICON[providerType];
                return (
                  <MultiSelectItem
                    key={id}
                    value={id}
                    badgeLabel={displayName}
                    aria-label={`${displayName} account (${providerType.toUpperCase()})`}
                  >
                    <span aria-hidden="true">{icon}</span>
                    <span className="truncate">{displayName}</span>
                  </MultiSelectItem>
                );
              })}
            </>
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              {selectedTypesList.length > 0
                ? "선택한 제공자에 표시할 계정이 없습니다"
                : "연결된 계정이 없습니다"}
            </div>
          )}
        </MultiSelectContent>
      </MultiSelect>
    </div>
  );
}
