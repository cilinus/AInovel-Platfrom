import EpisodeReader from '@/src/components/episodes/EpisodeReader';

export default async function EpisodeViewerPage({
  params,
}: {
  params: Promise<{ workId: string; episodeId: string }>;
}) {
  const { workId, episodeId } = await params;
  return <EpisodeReader workId={workId} episodeId={episodeId} />;
}