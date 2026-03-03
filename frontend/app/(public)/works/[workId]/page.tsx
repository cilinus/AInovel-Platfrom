import WorkDetailContent from '@/src/components/works/WorkDetailContent';

export default async function WorkDetailPage({
  params,
}: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  return <WorkDetailContent workId={workId} />;
}
