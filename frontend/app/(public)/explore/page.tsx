import { Suspense } from 'react';
import ExploreContent from '@/src/components/explore/ExploreContent';
import Loading from '@/src/components/common/Loading';

export default function ExplorePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ExploreContent />
    </Suspense>
  );
}
