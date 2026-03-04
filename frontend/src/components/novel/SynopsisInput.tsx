'use client';

import { useNovelStore } from '@/src/stores/novelStore';
import Textarea from '@/src/components/common/Textarea';

export default function SynopsisInput() {
  const synopsis = useNovelStore((s) => s.settings.synopsis);
  const setSynopsis = useNovelStore((s) => s.setSynopsis);

  return (
    <Textarea
      label="시놉시스"
      value={synopsis}
      onChange={(e) => setSynopsis(e.target.value)}
      maxLength={2000}
      rows={6}
      fullWidth
      placeholder="소설의 줄거리를 입력해주세요. 주인공, 배경, 갈등 구조 등을 포함하면 더 좋은 결과를 얻을 수 있습니다."
    />
  );
}