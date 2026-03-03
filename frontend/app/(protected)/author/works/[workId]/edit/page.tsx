'use client';

import { use } from 'react';
import WorkEditForm from '@/src/components/author/WorkEditForm';

export default function WorkEditPage({ params }: { params: Promise<{ workId: string }> }) {
  const { workId } = use(params);
  return <WorkEditForm workId={workId} />;
}