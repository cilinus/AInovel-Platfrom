import ProjectDetail from '@/src/components/novel/ProjectDetail';

export const metadata = {
  title: 'AI 소설 프로젝트 | AiNovel',
  description: 'AI 소설 프로젝트 상세 및 챕터 관리',
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectDetail projectId={projectId} />;
}