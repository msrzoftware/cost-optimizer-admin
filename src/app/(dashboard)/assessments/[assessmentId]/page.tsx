import {
  AssessmentDetailPage,
  type DetailTab,
} from "@/components/assessments/assessments-page";

type AssessmentDetailRoutePageProps = {
  params: Promise<{
    assessmentId: string;
  }>;
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
};

export default async function AssessmentDetailRoutePage({
  params,
  searchParams,
}: AssessmentDetailRoutePageProps) {
  const { assessmentId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  return (
    <AssessmentDetailPage
      activeTab={getDetailTab(resolvedSearchParams.tab)}
      assessmentId={decodeURIComponent(assessmentId)}
    />
  );
}

const assessmentDetailTabs = new Set<DetailTab>([
  "overview",
  "activity",
  "processes",
  "due-diligence",
  "results",
  "strategy",
  "expert",
  "notes",
]);

function getDetailTab(tab: string | string[] | undefined): DetailTab {
  const tabValue = Array.isArray(tab) ? tab[0] : tab;

  if (tabValue && isDetailTab(tabValue)) {
    return tabValue;
  }

  return "overview";
}

function isDetailTab(value: string): value is DetailTab {
  return assessmentDetailTabs.has(value as DetailTab);
}
