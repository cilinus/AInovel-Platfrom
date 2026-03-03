// ---------------------------------------------------------------------------
// Mock Data for AI Novel Platform
// All data shapes follow the API response format (before hook transformation).
// ---------------------------------------------------------------------------

import type { Episode } from '../types/episode';
import type { Comment } from '../types/comment';
import type { RatingStats } from '../types/rating';

// ---------------------------------------------------------------------------
// Helper: Generate inline SVG data URI for work cover images
// ---------------------------------------------------------------------------

export function generateCoverSvg(
  title: string,
  color1: string,
  color2: string,
): string {
  // Split title into lines for word wrapping (approx 6 chars per line)
  const lines: string[] = [];
  const chars = [...title];
  let current = '';
  for (const ch of chars) {
    current += ch;
    if (current.length >= 6) {
      lines.push(current);
      current = '';
    }
  }
  if (current) lines.push(current);

  const textY = 260;
  const lineHeight = 36;
  const textElements = lines
    .map(
      (line, i) =>
        `<text x="150" y="${textY + i * lineHeight}" text-anchor="middle" fill="white" font-size="28" font-family="sans-serif" font-weight="bold">${line}</text>`,
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="400" fill="url(#bg)"/>
  <rect y="220" width="300" height="180" fill="rgba(0,0,0,0.35)"/>
  <line x1="40" y1="240" x2="260" y2="240" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
  ${textElements}
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Genre color mapping
// ---------------------------------------------------------------------------

export const GENRE_COLORS: Record<string, [string, string]> = {
  ROMANCE: ['#ec4899', '#f43f5e'],
  FANTASY: ['#a855f7', '#6366f1'],
  MARTIAL_ARTS: ['#f59e0b', '#f97316'],
  MODERN: ['#38bdf8', '#3b82f6'],
  MYSTERY: ['#64748b', '#4b5563'],
  SF: ['#06b6d4', '#14b8a6'],
};

// ---------------------------------------------------------------------------
// ApiWork shape (as returned by GET /works and GET /works/:id)
// ---------------------------------------------------------------------------

export interface ApiWork {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  genre: string;
  tags?: string[];
  status?: string;
  contentType?: string;
  isAiGenerated?: boolean;
  episodeCount?: number;
  stats?: {
    viewCount?: number;
    likeCount?: number;
    bookmarkCount?: number;
    averageRating?: number;
    ratingCount?: number;
  };
  authorId?: { nickname: string; profileImage?: string };
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 1. MOCK_WORKS - 20 works across 6 genres
// ---------------------------------------------------------------------------

export const MOCK_WORKS: ApiWork[] = [
  // ── ROMANCE (4 works) ────────────────────────────────────────────────────
  {
    _id: 'work_001',
    title: '달빛 아래 사랑의 고백',
    description:
      '평범한 대학생 수아는 도서관에서 우연히 만난 남자에게 점점 끌리게 된다. 하지만 그에게는 아무에게도 말하지 못한 비밀이 있었다. 달빛이 내리는 캠퍼스에서 시작된 두 사람의 이야기는 예상치 못한 방향으로 흘러간다.',
    coverImage: generateCoverSvg('달빛 아래 사랑의 고백', '#ec4899', '#f43f5e'),
    genre: 'ROMANCE',
    tags: ['캠퍼스', '순정', '비밀연애'],
    status: 'ONGOING',
    contentType: 'HUMAN',
    isAiGenerated: false,
    episodeCount: 45,
    stats: {
      viewCount: 128500,
      likeCount: 8920,
      bookmarkCount: 4310,
      averageRating: 4.7,
      ratingCount: 2150,
    },
    authorId: { nickname: '달빛서재' },
    createdAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-06-20T14:30:00.000Z',
  },
  {
    _id: 'work_002',
    title: '재벌 3세와 비밀 계약',
    description:
      '빚에 쫓기던 지은은 대한민국 최대 그룹 후계자 한결의 제안을 받는다. 1년간의 계약 연애, 그 조건은 완벽했다. 그러나 계약서에 적히지 않은 감정이 싹트기 시작하면서, 두 사람의 관계는 걷잡을 수 없이 복잡해진다.',
    coverImage: generateCoverSvg('재벌 3세와 비밀 계약', '#ec4899', '#f43f5e'),
    genre: 'ROMANCE',
    tags: ['재벌', '계약연애', '신데렐라'],
    status: 'ONGOING',
    contentType: 'HUMAN',
    isAiGenerated: false,
    episodeCount: 78,
    stats: {
      viewCount: 256300,
      likeCount: 18400,
      bookmarkCount: 9870,
      averageRating: 4.8,
      ratingCount: 5620,
    },
    authorId: { nickname: '로즈가든' },
    createdAt: '2025-02-01T10:00:00.000Z',
    updatedAt: '2025-07-15T18:45:00.000Z',
  },
  {
    _id: 'work_003',
    title: '운명처럼 널 만났다',
    description:
      '시간을 되돌릴 수 있다면, 그날 그 카페에서 너를 다시 만날 수 있을까. 전생의 기억을 가진 채 현재로 돌아온 서연은 잃어버린 사랑을 되찾기 위해 운명에 맞선다.',
    coverImage: generateCoverSvg('운명처럼 널 만났다', '#ec4899', '#f43f5e'),
    genre: 'ROMANCE',
    tags: ['회귀', '운명', '재회'],
    status: 'COMPLETED',
    contentType: 'HYBRID',
    isAiGenerated: false,
    episodeCount: 120,
    stats: {
      viewCount: 342100,
      likeCount: 24500,
      bookmarkCount: 12800,
      averageRating: 4.9,
      ratingCount: 8900,
    },
    authorId: { nickname: '은하수' },
    createdAt: '2025-01-05T08:00:00.000Z',
    updatedAt: '2025-05-30T20:00:00.000Z',
  },
  {
    _id: 'work_004',
    title: '꽃비 내리는 궁궐에서',
    description:
      '조선 시대, 궁녀로 입궁한 소화는 우연히 세자의 비밀 서재를 발견한다. 금지된 사랑이 꽃처럼 피어나지만, 궁궐의 음모와 권력 다툼이 두 사람을 갈라놓으려 한다.',
    coverImage: generateCoverSvg('꽃비 내리는 궁궐에서', '#ec4899', '#f43f5e'),
    genre: 'ROMANCE',
    tags: ['사극', '궁궐', '금지된사랑'],
    status: 'ONGOING',
    contentType: 'HUMAN',
    isAiGenerated: false,
    episodeCount: 56,
    stats: {
      viewCount: 89400,
      likeCount: 6200,
      bookmarkCount: 3100,
      averageRating: 4.5,
      ratingCount: 1800,
    },
    authorId: { nickname: '매화향' },
    createdAt: '2025-03-10T11:00:00.000Z',
    updatedAt: '2025-07-22T16:15:00.000Z',
  },

  // ── FANTASY (4 works) ────────────────────────────────────────────────────
  {
    _id: 'work_005',
    title: '무한 레벨업 시스템',
    description:
      '평범한 고등학생 진우는 어느 날 눈앞에 나타난 시스템 창을 통해 레벨업이 가능한 존재가 된다. 던전이 현실과 겹치기 시작하면서, 그는 인류의 마지막 희망이 되어야 한다.',
    coverImage: generateCoverSvg('무한 레벨업 시스템', '#a855f7', '#6366f1'),
    genre: 'FANTASY',
    tags: ['시스템', '레벨업', '던전'],
    status: 'ONGOING',
    contentType: 'HUMAN',
    isAiGenerated: false,
    episodeCount: 95,
    stats: {
      viewCount: 512000,
      likeCount: 35600,
      bookmarkCount: 18900,
      averageRating: 4.6,
      ratingCount: 12400,
    },
    authorId: { nickname: '드래곤펜' },
    createdAt: '2025-01-02T07:00:00.000Z',
    updatedAt: '2025-07-25T10:30:00.000Z',
  },
  {
    _id: 'work_006',
    title: '용의 후예',
    description:
      '천년 동안 잠들어 있던 용족의 피가 깨어난다. 마지막 용의 후예인 현석은 자신의 정체를 숨긴 채 인간 세계에서 살아왔지만, 마족의 침공이 시작되면서 더 이상 도망칠 수 없게 된다.',
    coverImage: generateCoverSvg('용의 후예', '#a855f7', '#6366f1'),
    genre: 'FANTASY',
    tags: ['용족', '각성', '마족전쟁'],
    status: 'ONGOING',
    contentType: 'AI',
    isAiGenerated: true,
    episodeCount: 62,
    stats: {
      viewCount: 178900,
      likeCount: 11200,
      bookmarkCount: 5600,
      averageRating: 4.3,
      ratingCount: 3200,
    },
    authorId: { nickname: 'AI작가_01' },
    createdAt: '2025-02-20T09:30:00.000Z',
    updatedAt: '2025-07-18T12:00:00.000Z',
  },
  {
    _id: 'work_007',
    title: '차원을 넘어서',
    description:
      '이세계로 소환된 프로그래머 민준은 자신의 코딩 능력이 이 세계에서는 마법과 같다는 사실을 깨닫는다. 알고리즘으로 마법진을 설계하고, 논리로 세계를 구하는 색다른 이세계 모험이 시작된다.',
    coverImage: generateCoverSvg('차원을 넘어서', '#a855f7', '#6366f1'),
    genre: 'FANTASY',
    tags: ['이세계', '프로그래머', '퓨전'],
    status: 'COMPLETED',
    contentType: 'HYBRID',
    isAiGenerated: false,
    episodeCount: 88,
    stats: {
      viewCount: 145600,
      likeCount: 9800,
      bookmarkCount: 4700,
      averageRating: 4.4,
      ratingCount: 2800,
    },
    authorId: { nickname: '코드마법사' },
    createdAt: '2025-01-20T13:00:00.000Z',
    updatedAt: '2025-06-10T09:00:00.000Z',
  },
  {
    _id: 'work_008',
    title: '마법사의 마지막 임무',
    description:
      '대륙 최강의 마법사 아르카는 마지막 임무를 받는다. 세계를 멸망시킬 수 있는 금단의 마법서를 파괴하라. 하지만 그 마법서에는 그의 잃어버린 기억이 담겨 있었다.',
    coverImage: generateCoverSvg('마법사의 마지막 임무', '#a855f7', '#6366f1'),
    genre: 'FANTASY',
    tags: ['마법사', '임무', '금단의마법'],
    status: 'COMPLETED',
    contentType: 'AI',
    isAiGenerated: true,
    episodeCount: 110,
    stats: {
      viewCount: 201300,
      likeCount: 14100,
      bookmarkCount: 7200,
      averageRating: 4.5,
      ratingCount: 4500,
    },
    authorId: { nickname: 'AI작가_02' },
    createdAt: '2025-01-10T06:00:00.000Z',
    updatedAt: '2025-04-28T15:00:00.000Z',
  },

  // ── MARTIAL_ARTS (3 works) ───────────────────────────────────────────────
  {
    _id: 'work_009',
    title: '천하제일 검선',
    description:
      '검의 끝에서 도를 깨달은 자, 그를 검선이라 부른다. 무림에서 가장 낮은 곳에서 시작한 소년 강호는 스승의 유언을 따라 천하제일을 향해 검을 들어올린다.',
    coverImage: generateCoverSvg('천하제일 검선', '#f59e0b', '#f97316'),
    genre: 'MARTIAL_ARTS',
    tags: ['검선', '무림', '성장'],
    status: 'ONGOING',
    contentType: 'HUMAN',
    isAiGenerated: false,
    episodeCount: 84,
    stats: {
      viewCount: 167800,
      likeCount: 12300,
      bookmarkCount: 6100,
      averageRating: 4.6,
      ratingCount: 3700,
    },
    authorId: { nickname: '검우' },
    createdAt: '2025-01-25T08:30:00.000Z',
    updatedAt: '2025-07-20T11:00:00.000Z',
  },
  {
    _id: 'work_010',
    title: '무림맹주의 귀환',
    description:
      '천하를 호령하던 무림맹주가 배신으로 쓰러진 후, 100년 뒤 젊은 몸으로 환생한다. 과거의 기억과 미래의 지식을 가진 그가 다시 한 번 강호를 뒤흔든다.',
    coverImage: generateCoverSvg('무림맹주의 귀환', '#f59e0b', '#f97316'),
    genre: 'MARTIAL_ARTS',
    tags: ['회귀', '무림맹주', '복수'],
    status: 'ONGOING',
    contentType: 'HUMAN',
    isAiGenerated: false,
    episodeCount: 67,
    stats: {
      viewCount: 234500,
      likeCount: 16800,
      bookmarkCount: 8400,
      averageRating: 4.7,
      ratingCount: 5100,
    },
    authorId: { nickname: '풍운검객' },
    createdAt: '2025-02-10T07:00:00.000Z',
    updatedAt: '2025-07-23T09:30:00.000Z',
  },
  {
    _id: 'work_011',
    title: '절대검감',
    description:
      '타고난 검의 재능, 절대검감. 모든 검술을 한 번 보면 익히는 천재 소년이 사파의 음모에 맞서 정도를 걷는다. 검 하나로 세상의 부조리에 맞서는 통쾌한 무협 활극.',
    coverImage: generateCoverSvg('절대검감', '#f59e0b', '#f97316'),
    genre: 'MARTIAL_ARTS',
    tags: ['천재', '절대검감', '정파'],
    status: 'HIATUS',
    contentType: 'HYBRID',
    isAiGenerated: false,
    episodeCount: 34,
    stats: {
      viewCount: 56700,
      likeCount: 3400,
      bookmarkCount: 1800,
      averageRating: 4.2,
      ratingCount: 980,
    },
    authorId: { nickname: '무림서생' },
    createdAt: '2025-04-05T10:00:00.000Z',
    updatedAt: '2025-06-01T08:00:00.000Z',
  },

  // ── MODERN (3 works) ─────────────────────────────────────────────────────
  {
    _id: 'work_012',
    title: '서울 연가',
    description:
      '서울의 사계절을 배경으로 펼쳐지는 네 남녀의 엇갈린 사랑 이야기. 한강 다리 위에서 시작된 인연이 종로의 골목, 홍대의 카페, 남산의 야경 속에서 조금씩 완성되어 간다.',
    coverImage: generateCoverSvg('서울 연가', '#38bdf8', '#3b82f6'),
    genre: 'MODERN',
    tags: ['서울', '사계절', '군상극'],
    status: 'COMPLETED',
    contentType: 'HUMAN',
    isAiGenerated: false,
    episodeCount: 38,
    stats: {
      viewCount: 72300,
      likeCount: 5100,
      bookmarkCount: 2600,
      averageRating: 4.4,
      ratingCount: 1500,
    },
    authorId: { nickname: '서울산책' },
    createdAt: '2025-03-01T09:00:00.000Z',
    updatedAt: '2025-07-19T13:00:00.000Z',
  },
  {
    _id: 'work_013',
    title: '캠퍼스 러브레터',
    description:
      '익명의 편지로 시작된 대학 캠퍼스의 설렘. 매주 월요일 사물함에 도착하는 편지의 주인을 찾아 나서는 하은의 좌충우돌 캠퍼스 라이프와 풋풋한 첫사랑 이야기.',
    coverImage: generateCoverSvg('캠퍼스 러브레터', '#38bdf8', '#3b82f6'),
    genre: 'MODERN',
    tags: ['캠퍼스', '편지', '첫사랑'],
    status: 'ONGOING',
    contentType: 'AI',
    isAiGenerated: true,
    episodeCount: 22,
    stats: {
      viewCount: 34200,
      likeCount: 2800,
      bookmarkCount: 1400,
      averageRating: 4.1,
      ratingCount: 720,
    },
    authorId: { nickname: 'AI작가_03' },
    createdAt: '2025-05-15T11:00:00.000Z',
    updatedAt: '2025-07-21T17:30:00.000Z',
  },
  {
    _id: 'work_014',
    title: '오피스 서바이벌',
    description:
      '대한민국 최대 IT 기업에 입사한 신입사원 태양. 살벌한 실적 경쟁, 예측불가한 상사, 그리고 뜻밖의 사내 로맨스까지. 웃기고 공감 가는 직장인 생존기.',
    coverImage: generateCoverSvg('오피스 서바이벌', '#38bdf8', '#3b82f6'),
    genre: 'MODERN',
    tags: ['직장인', 'IT기업', '사내연애'],
    status: 'ONGOING',
    contentType: 'AI',
    isAiGenerated: true,
    episodeCount: 15,
    stats: {
      viewCount: 18900,
      likeCount: 1500,
      bookmarkCount: 780,
      averageRating: 4.0,
      ratingCount: 410,
    },
    authorId: { nickname: 'AI작가_04' },
    createdAt: '2025-06-01T14:00:00.000Z',
    updatedAt: '2025-07-24T10:00:00.000Z',
  },

  // ── MYSTERY (3 works) ────────────────────────────────────────────────────
  {
    _id: 'work_015',
    title: '13번째 방',
    description:
      '오래된 호텔의 13번째 방에 투숙한 손님들이 하나둘 사라진다. 형사 도윤은 사건을 조사하면서, 이 호텔에 얽힌 30년 전의 비극을 마주하게 된다.',
    coverImage: generateCoverSvg('13번째 방', '#64748b', '#4b5563'),
    genre: 'MYSTERY',
    tags: ['호텔', '미스터리', '연쇄실종'],
    status: 'COMPLETED',
    contentType: 'HUMAN',
    isAiGenerated: false,
    episodeCount: 52,
    stats: {
      viewCount: 198700,
      likeCount: 14200,
      bookmarkCount: 7100,
      averageRating: 4.8,
      ratingCount: 4300,
    },
    authorId: { nickname: '미드나잇' },
    createdAt: '2025-01-08T06:30:00.000Z',
    updatedAt: '2025-04-15T22:00:00.000Z',
  },
  {
    _id: 'work_016',
    title: '살인자의 기억',
    description:
      '기억을 잃은 채 깨어난 남자의 손에는 피가 묻어 있었다. 자신이 살인자인지 확인하기 위해 과거를 추적하는 그의 여정은, 예상치 못한 진실로 이어진다.',
    coverImage: generateCoverSvg('살인자의 기억', '#64748b', '#4b5563'),
    genre: 'MYSTERY',
    tags: ['기억상실', '살인', '반전'],
    status: 'ONGOING',
    contentType: 'HUMAN',
    isAiGenerated: false,
    episodeCount: 41,
    stats: {
      viewCount: 112400,
      likeCount: 8600,
      bookmarkCount: 4200,
      averageRating: 4.6,
      ratingCount: 2700,
    },
    authorId: { nickname: '다크노벨' },
    createdAt: '2025-03-20T08:00:00.000Z',
    updatedAt: '2025-07-22T20:15:00.000Z',
  },
  {
    _id: 'work_017',
    title: '미궁의 밤',
    description:
      '매년 같은 날, 같은 장소에서 벌어지는 불가능한 범죄. 은퇴한 프로파일러 정민은 마지막으로 이 사건을 해결하기 위해 다시 현장으로 돌아온다. 미궁 속의 미궁, 끝이 보이지 않는 추리가 시작된다.',
    coverImage: generateCoverSvg('미궁의 밤', '#64748b', '#4b5563'),
    genre: 'MYSTERY',
    tags: ['프로파일러', '미궁', '불가능범죄'],
    status: 'HIATUS',
    contentType: 'HYBRID',
    isAiGenerated: false,
    episodeCount: 28,
    stats: {
      viewCount: 43200,
      likeCount: 2900,
      bookmarkCount: 1500,
      averageRating: 4.3,
      ratingCount: 850,
    },
    authorId: { nickname: '추리왕' },
    createdAt: '2025-04-12T12:00:00.000Z',
    updatedAt: '2025-06-15T14:00:00.000Z',
  },

  // ── SF (3 works) ─────────────────────────────────────────────────────────
  {
    _id: 'work_018',
    title: '최후의 행성',
    description:
      '지구가 멸망한 후, 인류의 마지막 생존자들은 미지의 행성으로 향한다. 새로운 세계에서 인류는 다시 시작할 수 있을까. 희망과 절망 사이에서 벌어지는 웅장한 우주 서사시.',
    coverImage: generateCoverSvg('최후의 행성', '#06b6d4', '#14b8a6'),
    genre: 'SF',
    tags: ['우주', '멸망', '생존'],
    status: 'ONGOING',
    contentType: 'AI',
    isAiGenerated: true,
    episodeCount: 47,
    stats: {
      viewCount: 87600,
      likeCount: 6100,
      bookmarkCount: 3200,
      averageRating: 4.4,
      ratingCount: 1900,
    },
    authorId: { nickname: 'AI작가_05' },
    createdAt: '2025-02-28T10:00:00.000Z',
    updatedAt: '2025-07-20T08:00:00.000Z',
  },
  {
    _id: 'work_019',
    title: '네오 서울 2099',
    description:
      '2099년의 서울, 인간과 안드로이드가 공존하는 세상. 해커 출신 형사 재현은 안드로이드 범죄를 수사하면서, 인간성의 경계에 대한 질문을 마주한다. 사이버펑크 느와르.',
    coverImage: generateCoverSvg('네오 서울 2099', '#06b6d4', '#14b8a6'),
    genre: 'SF',
    tags: ['사이버펑크', '안드로이드', '느와르'],
    status: 'COMPLETED',
    contentType: 'HUMAN',
    isAiGenerated: false,
    episodeCount: 65,
    stats: {
      viewCount: 156200,
      likeCount: 11800,
      bookmarkCount: 5900,
      averageRating: 4.7,
      ratingCount: 3600,
    },
    authorId: { nickname: '네온라이터' },
    createdAt: '2025-01-18T15:00:00.000Z',
    updatedAt: '2025-05-22T19:00:00.000Z',
  },
  {
    _id: 'work_020',
    title: '시간여행자의 일기',
    description:
      '물리학 교수 지수는 실험 도중 시간여행 능력을 얻게 된다. 과거를 바꿀 때마다 현재가 뒤틀리고, 모든 선택에는 대가가 따른다. 시간의 역설 속에서 그녀가 지키고 싶은 것은 단 하나.',
    coverImage: generateCoverSvg('시간여행자의 일기', '#06b6d4', '#14b8a6'),
    genre: 'SF',
    tags: ['시간여행', '역설', '물리학'],
    status: 'ONGOING',
    contentType: 'AI',
    isAiGenerated: true,
    episodeCount: 31,
    stats: {
      viewCount: 52400,
      likeCount: 3800,
      bookmarkCount: 2000,
      averageRating: 4.2,
      ratingCount: 1100,
    },
    authorId: { nickname: 'AI작가_06' },
    createdAt: '2025-05-01T07:00:00.000Z',
    updatedAt: '2025-07-23T15:45:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// 2. MOCK_EPISODES - Episodes for the first 5 works
// ---------------------------------------------------------------------------

// Hand-written Korean web novel content per work (5 episodes each)

const EPISODE_CONTENTS: Record<string, string[]> = {
  // work_001: 달빛 아래 사랑의 고백 (ROMANCE)
  work_001: [
    `수아는 도서관 3층 구석 자리에 앉아 두꺼운 전공 서적을 펼쳤다. 중간고사가 일주일 앞으로 다가왔지만 머릿속에는 아무것도 들어오지 않았다. 창밖으로 보이는 캠퍼스에는 벚꽃이 흩날리고 있었다.

"여기 앉아도 될까요?"

고개를 들자, 낯선 남자가 맞은편 의자를 가리키며 서 있었다. 짙은 갈색 눈에 약간 긴 머리카락. 처음 보는 얼굴인데도 묘하게 익숙한 느낌이 들었다.

"네, 앉으세요." 수아는 무심하게 대답했지만, 그가 앉은 후에도 시선이 자꾸 그쪽으로 향했다. 남자는 노트북을 열고 무언가를 열심히 타이핑하고 있었다. 화면에는 코드 같은 것이 빼곡히 채워져 있었다.

그날 이후, 수아는 매일 같은 자리에 앉았다. 그리고 그 남자도.`,

    `일주일째 같은 자리에서 마주치고 있었다. 수아는 그의 이름도 전공도 몰랐지만, 그가 블랙 커피를 좋아한다는 것, 집중할 때 왼쪽 귀 뒤를 긁는 버릇이 있다는 것은 알게 되었다.

"혹시 컴공이세요?" 용기를 내어 먼저 말을 걸었다. 남자가 고개를 들었다. 가까이서 보니 속눈썹이 유난히 길었다.

"네, 3학년이요. 저는 이준혁이에요." 그가 부드럽게 웃었다. 그 웃음에 수아의 심장이 한 박자 빠르게 뛰었다.

"저는 김수아, 국문과 2학년이에요." 수아는 자신도 모르게 웃으며 대답했다. 도서관 안의 시간이 유독 천천히 흐르는 것 같았다.`,

    `준혁과 대화를 나누기 시작한 지 2주가 지났다. 도서관에서 만나 함께 공부하고, 가끔은 1층 카페에서 커피를 마시며 이야기를 나눴다. 수아는 그의 목소리가 좋았다. 낮고 차분한 톤으로 이야기할 때면 세상의 모든 소음이 사라지는 것 같았다.

"수아 씨는 왜 국문과에 왔어요?" 준혁이 아메리카노를 한 모금 마시며 물었다.

"글을 쓰고 싶어서요. 아직 잘 못 쓰지만." 수아는 부끄러운 듯 고개를 숙였다.

"언젠가 수아 씨가 쓴 소설을 읽어보고 싶네요." 준혁의 말에 수아의 볼이 붉게 물들었다. 카페 창밖으로 달빛이 캠퍼스를 환하게 비추고 있었다.`,

    `비가 쏟아지던 금요일 저녁, 수아는 도서관을 나서다가 우산 없이 처마 밑에 서 있는 준혁을 발견했다. 그는 핸드폰 화면을 응시하며 무언가를 기다리는 듯했다.

"우산 없어요?" 수아가 자신의 우산을 내밀었다.

"괜찮아요, 잠깐 기다리면 그칠 것 같은데." 준혁이 하늘을 올려다보며 말했지만, 빗줄기는 더 거세지기만 했다.

수아는 아무 말 없이 우산을 펼쳐 준혁 쪽으로 기울였다. 두 사람은 좁은 우산 아래에서 나란히 걸었다. 빗소리가 심장 소리를 덮어주기를 바라면서.

"다음에는 우산 두 개 가져올게요." 기숙사 앞에서 헤어지며 준혁이 웃었다. 그의 어깨는 이미 비에 젖어 있었다.`,

    `"준혁 씨, 이번 주말에 시간 있어요?"

수아는 심호흡을 하고 카톡 메시지를 보냈다. 전송 버튼을 누른 순간 후회가 밀려왔지만, 이미 늦었다. 읽음 표시가 바로 떴다.

'주말이요? 토요일 오후는 괜찮은데.'

심장이 쿵쾅거렸다. 수아는 떨리는 손으로 답장을 했다.

'남산타워 가본 적 있어요? 야경이 예쁘다고 해서.'

잠시 침묵이 흘렀다. 타이핑 중 표시가 나타났다가 사라지기를 세 번. 마침내 답이 왔다.

'좋아요. 꼭 가고 싶었던 곳이에요.'

수아는 핸드폰을 가슴에 안고 이불 속으로 파고들었다. 설레는 마음을 감출 수가 없었다. 토요일이 빨리 왔으면.`,
  ],

  // work_002: 재벌 3세와 비밀 계약 (ROMANCE)
  work_002: [
    `지은은 카페 알바를 마치고 지친 몸을 이끌고 원룸으로 돌아왔다. 현관문을 열자마자 쌓여 있는 고지서들이 눈에 들어왔다. 전기세, 수도세, 그리고 어머니 병원비 독촉장.

"이번 달도 힘들겠네..." 한숨을 내쉬며 냉장고를 열었지만, 유통기한이 지난 우유 한 팩뿐이었다.

핸드폰이 울렸다. 낯선 번호였다.

"박지은 씨죠? 한결 회장님께서 만나자고 하십니다. 내일 오후 3시, 강남 센트럴타워 52층." 차갑고 정중한 목소리였다.

한결. 대한그룹의 3세. 한국에서 모르는 사람이 없는 이름. 그런 사람이 왜 자신을 찾는 걸까.`,

    `센트럴타워 52층. 엘리베이터 문이 열리자 통유리 너머로 서울의 스카이라인이 펼쳐졌다. 지은은 자신의 남루한 차림이 갑자기 부끄러워졌다.

"어서 오세요, 박지은 씨." 창가에 서 있던 남자가 돌아섰다. TV에서만 보던 얼굴이 바로 앞에 있었다. 날카로운 턱선, 깊은 눈. 한결은 생각보다 젊어 보였다.

"단도직입적으로 말하겠습니다." 한결이 소파에 앉으며 서류 봉투를 내밀었다. "1년간 제 연인 역할을 해주세요. 보수는 월 2천만 원."

지은의 눈이 커졌다. "네? 무슨..."

"할머니께서 결혼을 재촉하고 계십니다. 진짜 연애할 시간은 없고. 서로 필요한 걸 주고받는 거죠." 한결의 표정은 담담했다. 마치 사업 제안을 하듯.`,

    `계약서를 들고 돌아온 지은은 밤새 뒤척였다. 월 2천만 원이면 어머니 병원비도, 밀린 공과금도, 학비도 모두 해결된다. 하지만 거짓으로 누군가의 연인을 연기한다는 것이 마음에 걸렸다.

결국 사흘 뒤, 지은은 한결에게 전화를 걸었다.

"하겠습니다. 대신 조건이 있어요."

"말해보세요."

"사생활 침해 없을 것. 신체 접촉 최소화. 그리고... 계약 기간이 끝나면 깨끗하게 끝낼 것."

전화기 너머로 한결의 낮은 웃음소리가 들렸다.

"당연하죠. 이건 비즈니스니까." 그의 목소리에는 묘한 자신감이 묻어 있었다. 지은은 왠지 모를 불안함을 느꼈다.`,

    `첫 번째 공식 행사는 한결의 할머니 생신 파티였다. 지은은 한결이 보내준 드레스를 입고 거울 앞에 섰다. 파란색 실크 드레스는 그녀의 몸에 완벽하게 맞았다.

"예쁘네요." 리무진 안에서 한결이 짧게 말했다. 그 한마디에 지은의 귀가 빨갛게 달아올랐다.

"연기 시작인 거죠?" 지은이 평정심을 유지하며 물었다.

한결이 잠시 그녀를 바라보다가 고개를 돌렸다. "...그래요. 연기."

파티장에 들어서자 수백 개의 시선이 쏠렸다. 한결이 자연스럽게 지은의 허리에 손을 얹었다. 계약서에는 최소한의 접촉이라고 적혀 있었는데, 그 손의 온기는 예상보다 따뜻했다.`,

    `한결과의 계약 생활이 한 달째에 접어들었다. 주말마다 함께 브런치를 먹고, 한결의 가족 모임에 참석하고, SNS에 커플 사진을 올렸다. 모든 것이 연기였지만, 어느 순간부터 경계가 흐려지기 시작했다.

"지은 씨, 오늘 피곤해 보여요." 한결이 운전하면서 말했다.

"알바 끝나고 바로 왔거든요."

한결의 미간이 살짝 찌푸려졌다. "알바는 그만두라고 했잖아요. 생활비는 계약에 포함되어 있는데."

"남의 돈으로 사는 건 싫어요." 지은이 단호하게 말했다.

한결이 차를 세우고 그녀를 바라보았다. "고집이 세네요." 그의 입꼬리가 미세하게 올라갔다. 지은은 그 표정을 처음 봤다. 차가운 재벌 3세가 아닌, 한 사람의 남자로서의 미소.`,
  ],

  // work_005: 무한 레벨업 시스템 (FANTASY)
  work_005: [
    `[시스템이 활성화되었습니다.]

교실 한가운데서 진우의 눈앞에 반투명한 푸른 창이 떠올랐다. 주위를 둘러봤지만 아무도 그 창을 보지 못하는 것 같았다. 수업 중인 영어 선생님은 여전히 칠판에 문법을 적고 있었다.

이름: 박진우
레벨: 1
HP: 100/100
MP: 10/10
힘: 5 | 민첩: 7 | 지능: 12 | 체력: 6

"뭐야 이게..." 진우는 당황해서 창을 손으로 밀어봤다. 창이 밀렸다가 다시 돌아왔다.

[튜토리얼 퀘스트가 생성되었습니다.]
[퀘스트: 첫 번째 걸음]
- 100m 전력 질주 (0/1)
- 보상: 경험치 50, 스킬 포인트 1

진우는 교실 밖을 바라보았다. 운동장이 보였다. 설마 지금 나가서 뛰라는 건가.`,

    `방과 후 운동장에서 전력 질주를 마친 진우 앞에 새로운 알림이 떠올랐다.

[퀘스트 완료! 경험치 50 획득]
[레벨 업! Lv.1 -> Lv.2]
[스킬 포인트 1 획득]
[새로운 스킬 해금: '감지(E급)']

"이게 진짜인 거야?" 진우는 헐떡이며 벤치에 앉았다. 손이 떨렸다. 게임에서나 보던 시스템이 현실에 나타나다니.

그때, 운동장 한쪽 구석에서 공기가 일그러지는 것이 보였다. 마치 열기가 피어오르는 것처럼 공간이 흔들렸다. 새로 얻은 '감지' 스킬이 반응했다.

[경고: 차원 균열 감지]
[E급 던전 포탈 발생 예상 시간: 23시간 59분]

진우의 얼굴이 창백해졌다. 던전이라니. 이건 게임이 아니라 현실이었다.`,

    `다음 날, 학교 운동장에 나타난 검은 균열 앞에 군인들이 모여들었다. 뉴스 헬기가 상공을 맴돌았고, 학생들은 대피했다.

진우만 다른 것을 보고 있었다. 시스템 창에는 새로운 퀘스트가 떠 있었다.

[긴급 퀘스트: 첫 번째 던전]
- E급 던전 클리어 (0/1)
- 보상: 경험치 500, 아이템 박스 1개, 칭호 '개척자'
- 실패 시: HP 0 (사망)

"사망이라고?" 진우는 침을 삼켰다. 하지만 시스템은 냉정했다. 군인들이 포탈에 진입하기 전, 진우의 몸이 저절로 끌려가듯 균열 앞에 섰다.

시스템의 안내음이 울렸다. [참가자 확인. 전투 모드 활성화.]

눈앞이 어두워지더니, 진우는 어두운 동굴 안에 서 있었다. 멀리서 낮은 으르렁거리는 소리가 들려왔다.`,

    `동굴 안은 축축하고 어두웠다. 진우의 앞에 무기 선택 창이 떴다.

[초보자 무기 지급]
- 낡은 단검 (공격력 +3)
- 나무 방패 (방어력 +2)
- 돌멩이 5개 (투척, 공격력 +1)

떨리는 손으로 단검을 선택하자, 손에 작은 칼이 쥐어졌다. 묵직한 실감이 전해졌다. 이건 게임이 아니다.

첫 번째 몬스터는 동굴 쥐였다. 크기가 강아지만 했다. 빨간 눈이 어둠 속에서 번뜩였다.

[동굴 쥐 Lv.1 | HP: 30]

진우는 공포를 삼키고 단검을 꽉 쥐었다. 쥐가 먼저 달려들었다. 본능적으로 옆으로 피하며 단검을 내리쳤다. 날카로운 비명과 함께 피가 튀었다.

[-15 데미지]

"한 번 더!" 진우가 소리치며 다시 단검을 휘둘렀다. 동굴 쥐가 쓰러졌다. 경험치 알림이 떴다. 온몸이 떨렸지만, 입꼬리가 올라갔다.`,

    `던전 탐색 3시간째. 진우는 동굴 쥐 12마리를 잡고 레벨 4가 되었다. 감지 스킬이 E+로 올라가면서 던전의 구조가 머릿속에 흐릿하게 그려지기 시작했다.

[보스 방 발견]
[던전 보스: 거대 동굴 쥐왕 Lv.5 | HP: 200]

보스 방 입구에서 진우는 주저앉았다. 체력이 절반밖에 남지 않았고, 포션도 없었다. 하지만 뒤로 돌아갈 수도 없었다. 시간 제한이 1시간 남았다.

"해야 해." 진우는 이를 악물고 일어섰다.

보스 방 안에는 사람 키만 한 쥐가 웅크리고 있었다. 그 주위로 작은 쥐들이 수십 마리. 진우는 단검을 고쳐 쥐고 전략을 세웠다. 레벨업으로 얻은 '신속(E급)' 스킬이 승부의 열쇠가 될 터였다.

[전투 개시]

진우의 몸이 푸른빛으로 감싸이며, 이전과는 비교할 수 없는 속도로 돌진했다.`,
  ],

  // work_009: 천하제일 검선 (MARTIAL_ARTS)
  work_009: [
    `소림산 아래 작은 마을, 강호는 아침 해가 뜨기도 전에 나무 검을 들고 뒷산으로 올랐다. 열세 살, 무공을 배운 지 올해로 5년째였다.

"자세가 흐트러졌다." 바위 위에 앉아 있던 스승 운허 도인이 눈을 뜨지 않고 말했다.

강호는 숨을 고르고 다시 기본 검식을 반복했다. 찌르고, 베고, 막고, 흘리고. 천 번을 해도 완벽하지 않았다.

"스승님, 언제쯤 진짜 검법을 배울 수 있을까요?" 강호가 지친 목소리로 물었다.

운허 도인이 느릿하게 눈을 떴다. "기본이 곧 진짜다. 천하의 모든 검법은 찌르고 베는 것에서 나온다. 그 진리를 깨달을 때, 너는 검선이 될 것이다."

강호는 고개를 끄덕였지만, 아직 그 뜻을 이해할 수 없었다.`,

    `스승 운허 도인이 세상을 떠난 것은 강호가 열다섯이 되던 봄이었다. 마지막으로 남긴 말은 단 하나였다.

"강호야, 세상에 나가거라. 검의 끝에서 도를 찾아라."

장례를 치른 후, 강호는 나무 검 대신 스승의 유품인 낡은 철검을 등에 메고 산을 내려갔다. 주머니에는 은자 다섯 냥이 전부였다.

첫 번째 마을에서 강호는 주막에 들렀다. 무림의 소식이 오가는 곳. 벽에 붙은 방문에는 이런 글이 적혀 있었다.

[천무대회 개최 - 열흘 후 낙양에서]
[참가 자격: 만 열다섯 이상 무림인]
[우승 상금: 금 백 냥]

강호의 눈이 빛났다. 천무대회. 무림의 젊은 고수들이 모이는 자리. 스승이 말한 '세상'은 아마 이런 곳일 것이다.`,

    `낙양으로 가는 길, 강호는 숲 속에서 도적떼를 만났다. 다섯 명의 산적이 칼을 빼들고 길을 막았다.

"꼬마, 가진 거 다 내놔라."

강호는 등의 철검을 뽑았다. 스승에게 배운 것은 기본 검식뿐이었지만, 5년간 매일 천 번씩 반복한 기본이었다.

첫 번째 산적이 달려들었다. 강호는 침착하게 칼을 흘려냈다. 운허 도인이 가르쳐준 '유수검(流水劍)' - 물이 바위를 흘러가듯 상대의 힘을 흘려보내는 기본 검식.

"뭐야 이놈!" 산적의 칼이 빗나가며 균형을 잃었다. 강호는 그 틈을 놓치지 않고 손목을 쳤다.

남은 네 명이 동시에 덤볐다. 강호의 몸이 자연스럽게 움직였다. 찌르고, 베고, 막고, 흘리고. 기본 네 식의 조합만으로 다섯 명의 산적을 제압했다.

"기본이 곧 진짜라..." 강호는 스승의 말을 되새기며 검을 거두었다.`,

    `낙양 천무대회장은 인산인해였다. 수백 명의 젊은 무인들이 실력을 겨루기 위해 모여들었다. 강호는 허름한 차림에 낡은 철검 하나 들고 서 있었다.

"저기, 저 애 좀 봐. 걸레 검 들고 왔어." 주위에서 비웃는 소리가 들렸다.

강호는 개의치 않았다. 검의 가치는 겉모습이 아니라 쓰는 사람에게 달려 있다는 것을 알고 있었다.

첫 번째 대전 상대는 화산파의 제자였다. 화려한 도복에 명검을 차고 있었다.

"화산파 이정풍이다. 손 봐주지 않겠다." 상대가 검을 빼며 포권했다.

강호도 철검을 빼들었다. "소림산 강호입니다. 잘 부탁드립니다."

두 검이 허공에서 부딪쳤다. 쨍, 맑은 금속음이 대회장에 울려 퍼졌다. 관중석이 술렁였다. 그 소리만으로도, 강호의 검에 담긴 내공이 보통이 아니라는 것을 알 수 있었다.`,

    `이정풍의 화산검법은 빠르고 화려했다. 매화가 피어나듯 연속으로 찌르는 매화검식은 빈틈이 없어 보였다.

하지만 강호의 눈에는 보였다. 화려한 검식 사이의 미세한 간격. 스승님은 이렇게 말씀하셨다. "모든 검술에는 숨이 있다. 숨을 들이쉬는 그 찰나가 곧 빈틈이다."

매화검식 일곱 번째 초식이 끝나는 순간, 강호가 움직였다. 기본 검식의 찌르기. 단 한 번의 직선 공격이 이정풍의 검 사이를 파고들었다.

"윽!" 이정풍의 도복이 찢어지며 가슴에 가느다란 선이 그어졌다. 피는 나지 않았다. 강호가 마지막 순간 힘을 거둔 것이다.

심판이 외쳤다. "승자, 강호!"

대회장이 순간 고요해졌다가, 폭발적인 함성이 터져 나왔다. 무명의 소년이 화산파 제자를 기본 검식 하나로 꺾은 것이다.

강호는 철검을 거두며 하늘을 올려다보았다. 스승님, 보고 계시죠.`,
  ],

  // work_015: 13번째 방 (MYSTERY)
  work_015: [
    `"또 실종이야." 강력반 형사 이도윤은 서류를 내려놓으며 한숨을 내쉬었다.

올드 그랜드 호텔. 1970년에 지어진 유서 깊은 건물에서 올해만 세 번째 투숙객이 사라졌다. 모두 13번째 방에 묵었던 손님들이었다.

"이번에는 누구야?" 도윤이 후배 형사 민서에게 물었다.

"김태호, 42세 남성. 사업가예요. 3일 전 체크인했는데 어제부터 연락이 안 된다고 가족이 신고했어요." 민서가 태블릿에서 자료를 읽었다.

도윤은 코트를 걸쳤다. "호텔 가보자."

올드 그랜드 호텔은 강남 뒷골목에 자리 잡고 있었다. 한때는 명사들이 드나들던 곳이지만, 지금은 낡은 외관에 투숙객도 뜸한 곳이었다. 로비에 들어서자 오래된 카펫 냄새가 코를 찔렀다.`,

    `13번째 방 앞에 선 도윤은 묘한 한기를 느꼈다. 문은 잠겨 있었고, 호텔 매니저가 마스터키로 열었다.

방 안은 깨끗했다. 너무 깨끗했다. 침대는 정돈되어 있었고, 욕실에는 물기 하나 없었다. 마치 아무도 묵지 않은 것처럼.

"CCTV는?" 도윤이 물었다.

"13층 복도 카메라가 3일 전부터 오작동이에요." 매니저가 불안한 얼굴로 대답했다.

"매번 그렇지?" 도윤이 날카롭게 물었다. 매니저의 얼굴이 하얗게 변했다.

도윤은 방 안을 천천히 살폈다. 옷장을 열자, 바닥에 작은 스크래치 자국이 있었다. 무언가를 끌었던 흔적. 옷장 뒤쪽 벽을 두드리자 텅 빈 소리가 났다.

"민서, 감식반 불러."`,

    `감식 결과 옷장 뒤에서 숨겨진 통로가 발견되었다. 좁고 어두운 통로는 호텔 지하로 이어져 있었다.

도윤은 손전등을 켜고 통로를 내려갔다. 벽에는 30년 전의 신문 기사가 붙어 있었다. '올드 그랜드 호텔 건축주 정해룡, 의문의 실종' - 1995년 기사였다.

지하 공간은 생각보다 넓었다. 오래된 가구와 상자들이 쌓여 있었고, 한쪽 벽에는 사진들이 빼곡히 붙어 있었다. 실종된 투숙객들의 사진. 이름과 날짜가 적혀 있었다.

"세상에..." 민서가 뒤에서 숨을 들이켰다. 사진은 12장이었다. 30년간 12명.

"13번째가 김태호 씨인 거야." 도윤의 목소리가 낮아졌다. 이건 단순 실종이 아니었다. 30년에 걸친 연쇄 범죄였다.

벽 끝에 한 장의 메모가 붙어 있었다. 떨리는 글씨로 적혀 있었다.

'13번째가 완성되면, 그가 돌아온다.'`,

    `"정해룡이 누군지 조사해." 도윤이 사무실로 돌아오자마자 지시했다.

세 시간 뒤, 민서가 자료를 들고 왔다.

"정해룡. 1970년 올드 그랜드 호텔을 지은 건축가이자 사업가. 건축 당시 풍수지리에 집착했다는 기록이 있어요. 13이라는 숫자에 특별한 의미를 부여했다고..."

"1995년에 실종됐다고?"

"네. 호텔 안에서 마지막으로 목격된 후 사라졌어요. 수색했지만 시신도 못 찾았고, 사건은 미제로 남았어요."

도윤은 호텔 설계도를 펼쳤다. 원래 도면에는 13층이 없었다. 나중에 추가된 것이었다. 그리고 13번째 방의 위치는 건물 정중앙, 가장 깊은 곳.

"이 호텔 자체가 하나의 장치야." 도윤이 중얼거렸다. "정해룡이 무언가를 위해 설계한 거지."

밤이 깊어지고 있었다. 호텔의 오래된 시계탑에서 열두 번의 종소리가 울렸다.`,

    `다음 날 새벽, 도윤은 정해룡의 생존한 조수 박원로를 찾아갔다. 80대 노인은 양로원 침대에 누워 천장을 바라보고 있었다.

"정해룡을 기억하십니까?" 도윤이 조심스럽게 물었다.

박원로의 눈이 초점을 잃었다가 다시 돌아왔다. "그 사람을... 왜 찾아?" 쉰 목소리에 공포가 묻어 있었다.

"호텔에서 사람들이 사라지고 있습니다. 30년 동안."

노인의 손이 떨리기 시작했다. "그럼 아직 끝나지 않은 거야. 그의 의식이..."

"의식? 무슨 의식이요?"

"해룡이는 미쳤어. 호텔을 지으면서 뭔가에 미쳐버렸지. 고대 문서를 발견한 후부터. 13명의 영혼을 바치면 시간을 되돌릴 수 있다고 믿었어." 노인이 이불을 움켜쥐었다. "그 호텔은 건물이 아니야, 형사 양반. 거대한 제단이야."

도윤의 등에 소름이 돋았다. 오컬트적 발상이었지만, 30년간 12명이 사라진 것은 사실이었다. 그리고 13번째 피해자가 지금 어딘가에 있다.`,
  ],
};

// ---------------------------------------------------------------------------
// Episode generation helpers
// ---------------------------------------------------------------------------

function generateEpisodeTitle(num: number): string {
  const subtitles: Record<number, string> = {
    1: '운명의 시작',
    2: '예상치 못한 만남',
    3: '첫 번째 시련',
    4: '변화의 조짐',
    5: '숨겨진 진실',
    6: '갈림길에서',
    7: '흔들리는 마음',
    8: '결심',
    9: '폭풍 전야',
    10: '대결',
    11: '뜻밖의 동맹',
    12: '과거의 그림자',
    13: '반격의 시작',
    14: '비밀의 열쇠',
    15: '어둠 속의 빛',
    16: '진심',
    17: '마지막 선택',
    18: '되돌릴 수 없는 것',
    19: '약속',
    20: '새로운 아침',
    21: '두 번째 기회',
    22: '불꽃',
    23: '조각난 기억',
    24: '결전의 날',
    25: '끝과 시작 사이',
  };
  return `제${num}화 - ${subtitles[num] ?? '이어지는 이야기'}`;
}

function generatePlaceholderContent(workId: string, episodeNum: number): string {
  const paragraphs = [
    '그날의 기억은 여전히 선명했다. 바람이 거세게 불던 오후, 모든 것이 바뀌기 시작한 순간을 잊을 수가 없었다. 주위의 풍경이 달라 보이기 시작한 것은 그때부터였다.',
    '"정말 괜찮은 거야?" 옆에서 걱정스러운 목소리가 들렸다. 고개를 돌리자 익숙한 얼굴이 보였다. 평소와 다름없는 표정이었지만, 눈 속에는 불안이 서려 있었다.',
    '시간이 갈수록 상황은 복잡해졌다. 처음에는 단순해 보였던 문제가 겹겹이 쌓인 실타래처럼 얽혀 있었다. 하나를 풀면 또 다른 매듭이 나타났다.',
    '깊은 한숨을 내쉬며 창밖을 바라보았다. 해가 지고 있었다. 붉은 노을이 하늘을 물들이며 서서히 사라져 갔다. 내일은 오늘과 다를 수 있을까.',
  ];

  const offset =
    (workId.charCodeAt(workId.length - 1) + episodeNum) % paragraphs.length;
  return [
    paragraphs[offset],
    paragraphs[(offset + 1) % paragraphs.length],
    paragraphs[(offset + 2) % paragraphs.length],
  ].join('\n\n');
}

function generateEpisodes(
  workId: string,
  totalCount: number,
  startDateStr: string,
): Episode[] {
  const episodes: Episode[] = [];
  const contents = EPISODE_CONTENTS[workId];
  const cap = Math.min(totalCount, 25);
  const baseDate = new Date(startDateStr);

  // Use a seeded pseudo-random based on workId for deterministic output
  const seed = workId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  for (let i = 1; i <= cap; i++) {
    const pubDate = new Date(baseDate);
    pubDate.setDate(pubDate.getDate() + (i - 1) * 3);

    const isFree = i <= 3;
    const hasCustomContent = contents != null && i <= contents.length;
    const content = hasCustomContent
      ? contents[i - 1]
      : generatePlaceholderContent(workId, i);

    const viewDecay = Math.max(0.3, 1 - (i - 1) * 0.015);
    const baseViews = workId === 'work_005' ? 15000 : 8000;
    const pseudoRand = ((seed * 31 + i * 17) % 1000) / 1000; // 0..1 deterministic

    episodes.push({
      id: `ep_${workId}_${String(i).padStart(3, '0')}`,
      workId,
      number: i,
      title: generateEpisodeTitle(i),
      content,
      wordCount: 500 + Math.floor(pseudoRand * 2500),
      price: isFree ? 0 : 3,
      isFree,
      isPublished: true,
      publishedAt: pubDate.toISOString(),
      viewCount: Math.floor(baseViews * viewDecay + pseudoRand * 2000),
      likeCount: Math.floor(baseViews * viewDecay * 0.08 + pseudoRand * 200),
      commentCount: Math.floor(pseudoRand * 80 + 5),
      createdAt: pubDate.toISOString(),
    });
  }

  return episodes;
}

export const MOCK_EPISODES: Record<string, Episode[]> = {
  work_001: generateEpisodes('work_001', 45, '2025-01-15'),
  work_002: generateEpisodes('work_002', 78, '2025-02-01'),
  work_005: generateEpisodes('work_005', 95, '2025-01-02'),
  work_009: generateEpisodes('work_009', 84, '2025-01-25'),
  work_015: generateEpisodes('work_015', 52, '2025-01-08'),
};

// ---------------------------------------------------------------------------
// 3. MOCK_USER - Logged-in user profile
// ---------------------------------------------------------------------------

export const MOCK_USER = {
  id: 'user_001',
  email: 'reader@ainovel.com',
  nickname: '소설독서광',
  role: 'USER' as const,
  provider: 'LOCAL' as const,
  profileImage: undefined,
  bio: '매일 웹소설을 읽는 열혈 독자입니다.',
  tokenBalance: 150,
  isAuthor: false,
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// 4. MOCK_AUTH_RESPONSE - Auth token response
// ---------------------------------------------------------------------------

export const MOCK_AUTH_RESPONSE = {
  accessToken: 'mock_jwt_token_for_development',
};

// ---------------------------------------------------------------------------
// 5. MOCK_AUTHOR_USER - Author user profile
// ---------------------------------------------------------------------------

export const MOCK_AUTHOR_USER = {
  id: 'user_002',
  email: 'author@ainovel.com',
  nickname: '달빛서재',
  role: 'AUTHOR' as const,
  provider: 'LOCAL' as const,
  profileImage: undefined,
  bio: 'AI 소설 플랫폼에서 활동하는 작가입니다.',
  tokenBalance: 5000,
  isAuthor: true,
  createdAt: '2024-12-01T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// 6. MOCK_COMMENTS - Comments per episode (keyed by episodeId)
// ---------------------------------------------------------------------------

export const MOCK_COMMENTS: Record<string, Comment[]> = {
  // ── work_001: 달빛 아래 사랑의 고백 ─────────────────────────────────────
  ep_work_001_001: [
    {
      id: 'comment_001',
      episodeId: 'ep_work_001_001',
      workId: 'work_001',
      userId: 'user_101',
      nickname: '소설덕후',
      content: '첫화부터 몰입감이 대단하네요! 다음화가 너무 기대됩니다.',
      likeCount: 42,
      isLiked: false,
      dislikeCount: 2,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-15T14:30:00.000Z',
      updatedAt: '2025-02-15T14:30:00.000Z',
    },
    {
      id: 'comment_001_reply_001',
      episodeId: 'ep_work_001_001',
      workId: 'work_001',
      userId: 'user_104',
      nickname: '달빛토끼',
      content: '진짜요! 저도 첫화부터 정주행 각이에요',
      likeCount: 8,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: 'comment_001',
      replies: [],
      createdAt: '2025-02-15T15:10:00.000Z',
      updatedAt: '2025-02-15T15:10:00.000Z',
    },
    {
      id: 'comment_001_reply_002',
      episodeId: 'ep_work_001_001',
      workId: 'work_001',
      userId: 'user_106',
      nickname: '웹소설매니아',
      content: '맞아요 몰입감 진짜 대박... 밤새 읽었습니다',
      likeCount: 5,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: 'comment_001',
      replies: [],
      createdAt: '2025-02-15T18:22:00.000Z',
      updatedAt: '2025-02-15T18:22:00.000Z',
    },
    {
      id: 'comment_002',
      episodeId: 'ep_work_001_001',
      workId: 'work_001',
      userId: 'user_102',
      nickname: '밤독서',
      content: '도서관에서 시작하는 설정이 너무 좋아요. 현실감 있어서 더 빠져듭니다.',
      likeCount: 28,
      isLiked: true,
      dislikeCount: 1,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-15T16:12:00.000Z',
      updatedAt: '2025-02-15T16:12:00.000Z',
    },
    {
      id: 'comment_003',
      episodeId: 'ep_work_001_001',
      workId: 'work_001',
      userId: 'user_103',
      nickname: '캠퍼스러브',
      content: '수아 캐릭터가 벌써 마음에 들어요ㅠㅠ 남주 정체가 뭘까 궁금하네요',
      likeCount: 35,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-16T09:45:00.000Z',
      updatedAt: '2025-02-16T09:45:00.000Z',
    },
    {
      id: 'comment_004',
      episodeId: 'ep_work_001_001',
      workId: 'work_001',
      userId: 'user_104',
      nickname: '달빛토끼',
      content: '작가님 문체가 정말 깔끔하세요. 읽는 내내 편안했습니다.',
      likeCount: 19,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-16T22:08:00.000Z',
      updatedAt: '2025-02-16T22:08:00.000Z',
    },
    {
      id: 'comment_005',
      episodeId: 'ep_work_001_001',
      workId: 'work_001',
      userId: 'user_105',
      nickname: '순정파',
      content: '혹시 남주가 코딩하는 건 뭔가 복선인가요? 뭔가 비밀이 있을 것 같은 느낌...',
      likeCount: 56,
      isLiked: false,
      dislikeCount: 3,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-17T11:30:00.000Z',
      updatedAt: '2025-02-17T11:30:00.000Z',
    },
    {
      id: 'comment_005_reply_001',
      episodeId: 'ep_work_001_001',
      workId: 'work_001',
      userId: 'user_103',
      nickname: '캠퍼스러브',
      content: '저도 그 생각했어요! 코딩이 스토리에 중요한 역할을 할 것 같아요',
      likeCount: 12,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: 'comment_005',
      replies: [],
      createdAt: '2025-02-17T13:00:00.000Z',
      updatedAt: '2025-02-17T13:00:00.000Z',
    },
    {
      id: 'comment_006',
      episodeId: 'ep_work_001_001',
      workId: 'work_001',
      userId: 'user_106',
      nickname: '웹소설매니아',
      content: '이런 장르 좋아하는 분들 꼭 읽어보세요! 강추합니다!!',
      likeCount: 12,
      isLiked: true,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-18T08:20:00.000Z',
      updatedAt: '2025-02-18T08:20:00.000Z',
    },
  ],
  ep_work_001_002: [
    {
      id: 'comment_007',
      episodeId: 'ep_work_001_002',
      workId: 'work_001',
      userId: 'user_107',
      nickname: '로맨스중독',
      content: '이준혁이라니... 이름부터 설레요ㅋㅋㅋ 빨리 썸 시작해주세요!',
      likeCount: 67,
      isLiked: false,
      dislikeCount: 1,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-18T15:00:00.000Z',
      updatedAt: '2025-02-18T15:00:00.000Z',
    },
    {
      id: 'comment_007_reply_001',
      episodeId: 'ep_work_001_002',
      workId: 'work_001',
      userId: 'user_111',
      nickname: '하트뿅뿅',
      content: '이준혁 이름만 봐도 심장이 두근두근ㅋㅋ',
      likeCount: 15,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: 'comment_007',
      replies: [],
      createdAt: '2025-02-18T16:30:00.000Z',
      updatedAt: '2025-02-18T16:30:00.000Z',
    },
    {
      id: 'comment_008',
      episodeId: 'ep_work_001_002',
      workId: 'work_001',
      userId: 'user_108',
      nickname: '책벌레진아',
      content: '속눈썹 묘사에서 심장이 쿵ㅠㅠ 작가님 디테일이 살아있어요',
      likeCount: 45,
      isLiked: true,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-19T10:22:00.000Z',
      updatedAt: '2025-02-19T10:22:00.000Z',
    },
    {
      id: 'comment_009',
      episodeId: 'ep_work_001_002',
      workId: 'work_001',
      userId: 'user_101',
      nickname: '소설덕후',
      content: '도서관 로맨스 최고... 대학 시절 생각나서 눈물 날 것 같아요',
      likeCount: 33,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-19T14:45:00.000Z',
      updatedAt: '2025-02-19T14:45:00.000Z',
    },
    {
      id: 'comment_010',
      episodeId: 'ep_work_001_002',
      workId: 'work_001',
      userId: 'user_109',
      nickname: '새벽감성',
      content: '두 사람 케미 미쳤다... 이 조합 너무 좋아요 작가님!!',
      likeCount: 51,
      isLiked: false,
      dislikeCount: 2,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-20T02:15:00.000Z',
      updatedAt: '2025-02-20T02:15:00.000Z',
    },
    {
      id: 'comment_011',
      episodeId: 'ep_work_001_002',
      workId: 'work_001',
      userId: 'user_110',
      nickname: '국문과선배',
      content: '국문과 설정이 반가워요ㅎㅎ 컴공남x국문과녀 조합 신선합니다',
      likeCount: 22,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-20T18:30:00.000Z',
      updatedAt: '2025-02-20T18:30:00.000Z',
    },
    {
      id: 'comment_012',
      episodeId: 'ep_work_001_002',
      workId: 'work_001',
      userId: 'user_111',
      nickname: '하트뿅뿅',
      content: '심장이 나를 배신한다... 왜 이렇게 설레죠 ㅠㅠㅠ',
      likeCount: 38,
      isLiked: true,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-21T09:00:00.000Z',
      updatedAt: '2025-02-21T09:00:00.000Z',
    },
    {
      id: 'comment_013',
      episodeId: 'ep_work_001_002',
      workId: 'work_001',
      userId: 'user_112',
      nickname: '독서의신',
      content: '컴공 3학년이면 졸업 프로젝트 시기인데 복선 아닌가요? 혼자 추리하는 중',
      likeCount: 14,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-02-21T20:45:00.000Z',
      updatedAt: '2025-02-21T20:45:00.000Z',
    },
  ],

  // ── work_005: 무한 레벨업 시스템 ─────────────────────────────────────────
  ep_work_005_001: [
    {
      id: 'comment_014',
      episodeId: 'ep_work_005_001',
      workId: 'work_005',
      userId: 'user_201',
      nickname: '헌터지망생',
      content: '시스템물 좋아하는 사람으로서 첫화부터 완벽합니다. 스탯창 나오는 순간 소름 돋았어요!',
      likeCount: 89,
      isLiked: false,
      dislikeCount: 3,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-05T10:00:00.000Z',
      updatedAt: '2025-01-05T10:00:00.000Z',
    },
    {
      id: 'comment_014_reply_001',
      episodeId: 'ep_work_005_001',
      workId: 'work_005',
      userId: 'user_203',
      nickname: '게임광',
      content: '스탯창 연출 진짜 잘했죠! 게임 UI처럼 생생하게 묘사됨',
      likeCount: 18,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: 'comment_014',
      replies: [],
      createdAt: '2025-01-05T11:30:00.000Z',
      updatedAt: '2025-01-05T11:30:00.000Z',
    },
    {
      id: 'comment_015',
      episodeId: 'ep_work_005_001',
      workId: 'work_005',
      userId: 'user_202',
      nickname: '던전마스터',
      content: '지능 12가 가장 높은 게 흥미롭네요. 힘으로 밀어붙이는 게 아니라 두뇌 플레이 주인공인 건가?',
      likeCount: 72,
      isLiked: true,
      dislikeCount: 1,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-05T12:30:00.000Z',
      updatedAt: '2025-01-05T12:30:00.000Z',
    },
    {
      id: 'comment_015_reply_001',
      episodeId: 'ep_work_005_001',
      workId: 'work_005',
      userId: 'user_206',
      nickname: '만렙독자',
      content: '두뇌 플레이 주인공 좋죠! 힘캐보다 훨씬 재미있을 것 같아요',
      likeCount: 10,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: 'comment_015',
      replies: [],
      createdAt: '2025-01-05T14:00:00.000Z',
      updatedAt: '2025-01-05T14:00:00.000Z',
    },
    {
      id: 'comment_016',
      episodeId: 'ep_work_005_001',
      workId: 'work_005',
      userId: 'user_203',
      nickname: '게임광',
      content: '튜토리얼 퀘스트ㅋㅋㅋ 100m 달리기부터 시작하는 거 현실적이면서 웃기네요',
      likeCount: 55,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-06T08:15:00.000Z',
      updatedAt: '2025-01-06T08:15:00.000Z',
    },
    {
      id: 'comment_017',
      episodeId: 'ep_work_005_001',
      workId: 'work_005',
      userId: 'user_204',
      nickname: '판타지킹',
      content: '수업 중에 시스템 창 뜨는 상황 상상하니까 너무 웃겨요ㅋㅋ 리얼리티 있는 묘사 좋습니다',
      likeCount: 41,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-06T15:40:00.000Z',
      updatedAt: '2025-01-06T15:40:00.000Z',
    },
    {
      id: 'comment_018',
      episodeId: 'ep_work_005_001',
      workId: 'work_005',
      userId: 'user_205',
      nickname: '레벨업중',
      content: '나도 이런 시스템 있었으면... 현실은 레벨업이 안 되서 슬프다',
      likeCount: 63,
      isLiked: true,
      dislikeCount: 2,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-07T09:20:00.000Z',
      updatedAt: '2025-01-07T09:20:00.000Z',
    },
    {
      id: 'comment_019',
      episodeId: 'ep_work_005_001',
      workId: 'work_005',
      userId: 'user_206',
      nickname: '만렙독자',
      content: '이거 나중에 월드급 던전 나올 거 같은 느낌... 초반에 학교 던전으로 시작하는 게 세계관 확장의 복선일 듯',
      likeCount: 47,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-07T21:50:00.000Z',
      updatedAt: '2025-01-07T21:50:00.000Z',
    },
  ],
  ep_work_005_002: [
    {
      id: 'comment_020',
      episodeId: 'ep_work_005_002',
      workId: 'work_005',
      userId: 'user_201',
      nickname: '헌터지망생',
      content: '차원 균열이 벌써 나오다니!! 23시간 카운트다운 긴장감 미쳤습니다',
      likeCount: 95,
      isLiked: false,
      dislikeCount: 1,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-08T11:00:00.000Z',
      updatedAt: '2025-01-08T11:00:00.000Z',
    },
    {
      id: 'comment_020_reply_001',
      episodeId: 'ep_work_005_002',
      workId: 'work_005',
      userId: 'user_208',
      nickname: '전략가',
      content: '카운트다운 연출이 진짜 심장 쫄깃하게 만들더라구요',
      likeCount: 14,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: 'comment_020',
      replies: [],
      createdAt: '2025-01-08T12:15:00.000Z',
      updatedAt: '2025-01-08T12:15:00.000Z',
    },
    {
      id: 'comment_021',
      episodeId: 'ep_work_005_002',
      workId: 'work_005',
      userId: 'user_207',
      nickname: '스킬수집가',
      content: '감지 스킬 E급이면 나중에 S급까지 성장하겠죠? 기대됩니다!!',
      likeCount: 58,
      isLiked: true,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-08T14:25:00.000Z',
      updatedAt: '2025-01-08T14:25:00.000Z',
    },
    {
      id: 'comment_022',
      episodeId: 'ep_work_005_002',
      workId: 'work_005',
      userId: 'user_208',
      nickname: '전략가',
      content: '레벨 2에 E급 던전이면 밸런스 괜찮은 건가? 보통 이런 전개면 주인공 많이 고생하는데...',
      likeCount: 34,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-09T08:50:00.000Z',
      updatedAt: '2025-01-09T08:50:00.000Z',
    },
    {
      id: 'comment_023',
      episodeId: 'ep_work_005_002',
      workId: 'work_005',
      userId: 'user_209',
      nickname: '씹덕반장',
      content: '시스템 경고 알림 연출이 소설인데도 긴박감이 느껴져요. 작가님 연출력 대단',
      likeCount: 76,
      isLiked: false,
      dislikeCount: 1,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-09T17:30:00.000Z',
      updatedAt: '2025-01-09T17:30:00.000Z',
    },
    {
      id: 'comment_024',
      episodeId: 'ep_work_005_002',
      workId: 'work_005',
      userId: 'user_210',
      nickname: '올빼미독자',
      content: '새벽에 읽기 시작했는데 벌써 2화... 다음화 정주행 각이다',
      likeCount: 29,
      isLiked: true,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-10T03:15:00.000Z',
      updatedAt: '2025-01-10T03:15:00.000Z',
    },
    {
      id: 'comment_025',
      episodeId: 'ep_work_005_002',
      workId: 'work_005',
      userId: 'user_204',
      nickname: '판타지킹',
      content: '군인들이랑 같이 던전 들어가나요? 아니면 혼자? 3화에서 알 수 있겠죠?',
      likeCount: 43,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-10T12:00:00.000Z',
      updatedAt: '2025-01-10T12:00:00.000Z',
    },
    {
      id: 'comment_026',
      episodeId: 'ep_work_005_002',
      workId: 'work_005',
      userId: 'user_211',
      nickname: '먼치킨팬',
      content: '아직 레벨 2인데 벌써 이 정도 몰입감이면 레벨 100 되면 어떨까... 기대 MAX',
      likeCount: 52,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: null,
      replies: [],
      createdAt: '2025-01-10T19:40:00.000Z',
      updatedAt: '2025-01-10T19:40:00.000Z',
    },
  ],
};

// ---------------------------------------------------------------------------
// 7. MOCK_RATINGS - Rating statistics per work (keyed by workId)
// ---------------------------------------------------------------------------

/**
 * Generate a plausible star-rating distribution that sums to `total` and has
 * its weight centred around the given `avg` (1-5).
 */
function generateDistribution(
  avg: number,
  total: number,
): Record<number, number> {
  // Raw weights: use an exponential decay away from the average
  const rawWeights: number[] = [];
  for (let star = 1; star <= 5; star++) {
    rawWeights.push(Math.exp(-1.2 * Math.abs(star - avg)));
  }
  const sum = rawWeights.reduce((a, b) => a + b, 0);

  // Convert to counts, rounding to integers
  const counts: number[] = rawWeights.map((w) => Math.round((w / sum) * total));

  // Fix rounding drift so the counts add up to exactly `total`
  let drift = total - counts.reduce((a, b) => a + b, 0);
  const peakIndex = Math.round(avg) - 1; // index of the star closest to avg
  counts[peakIndex] += drift;

  return { 1: counts[0], 2: counts[1], 3: counts[2], 4: counts[3], 5: counts[4] };
}

export const MOCK_RATINGS: Record<string, RatingStats> = {
  work_001: {
    workId: 'work_001',
    averageRating: 4.7,
    ratingCount: 2150,
    distribution: generateDistribution(4.7, 2150),
    userRating: null,
  },
  work_002: {
    workId: 'work_002',
    averageRating: 4.8,
    ratingCount: 5620,
    distribution: generateDistribution(4.8, 5620),
    userRating: null,
  },
  work_003: {
    workId: 'work_003',
    averageRating: 4.9,
    ratingCount: 8900,
    distribution: generateDistribution(4.9, 8900),
    userRating: null,
  },
  work_004: {
    workId: 'work_004',
    averageRating: 4.5,
    ratingCount: 1800,
    distribution: generateDistribution(4.5, 1800),
    userRating: null,
  },
  work_005: {
    workId: 'work_005',
    averageRating: 4.6,
    ratingCount: 12400,
    distribution: generateDistribution(4.6, 12400),
    userRating: null,
  },
  work_006: {
    workId: 'work_006',
    averageRating: 4.3,
    ratingCount: 3200,
    distribution: generateDistribution(4.3, 3200),
    userRating: null,
  },
  work_007: {
    workId: 'work_007',
    averageRating: 4.4,
    ratingCount: 2800,
    distribution: generateDistribution(4.4, 2800),
    userRating: null,
  },
  work_008: {
    workId: 'work_008',
    averageRating: 4.5,
    ratingCount: 4500,
    distribution: generateDistribution(4.5, 4500),
    userRating: null,
  },
  work_009: {
    workId: 'work_009',
    averageRating: 4.6,
    ratingCount: 3700,
    distribution: generateDistribution(4.6, 3700),
    userRating: null,
  },
  work_010: {
    workId: 'work_010',
    averageRating: 4.7,
    ratingCount: 5100,
    distribution: generateDistribution(4.7, 5100),
    userRating: null,
  },
  work_011: {
    workId: 'work_011',
    averageRating: 4.2,
    ratingCount: 980,
    distribution: generateDistribution(4.2, 980),
    userRating: null,
  },
  work_012: {
    workId: 'work_012',
    averageRating: 4.4,
    ratingCount: 1500,
    distribution: generateDistribution(4.4, 1500),
    userRating: null,
  },
  work_013: {
    workId: 'work_013',
    averageRating: 4.1,
    ratingCount: 720,
    distribution: generateDistribution(4.1, 720),
    userRating: null,
  },
  work_014: {
    workId: 'work_014',
    averageRating: 4.0,
    ratingCount: 410,
    distribution: generateDistribution(4.0, 410),
    userRating: null,
  },
  work_015: {
    workId: 'work_015',
    averageRating: 4.8,
    ratingCount: 4300,
    distribution: generateDistribution(4.8, 4300),
    userRating: null,
  },
  work_016: {
    workId: 'work_016',
    averageRating: 4.6,
    ratingCount: 2700,
    distribution: generateDistribution(4.6, 2700),
    userRating: null,
  },
  work_017: {
    workId: 'work_017',
    averageRating: 4.3,
    ratingCount: 850,
    distribution: generateDistribution(4.3, 850),
    userRating: null,
  },
  work_018: {
    workId: 'work_018',
    averageRating: 4.4,
    ratingCount: 1900,
    distribution: generateDistribution(4.4, 1900),
    userRating: null,
  },
  work_019: {
    workId: 'work_019',
    averageRating: 4.7,
    ratingCount: 3600,
    distribution: generateDistribution(4.7, 3600),
    userRating: null,
  },
  work_020: {
    workId: 'work_020',
    averageRating: 4.2,
    ratingCount: 1100,
    distribution: generateDistribution(4.2, 1100),
    userRating: null,
  },
};

// ---------------------------------------------------------------------------
// 6. MOCK_READING_HISTORY - Recently read works (for My Page)
// ---------------------------------------------------------------------------

export interface ReadingHistoryItem {
  workId: string;
  lastEpisodeId: string;
  lastEpisodeNumber: number;
  progress: number; // 0-100
  lastReadAt: string;
}

export const MOCK_READING_HISTORY: ReadingHistoryItem[] = [
  {
    workId: 'work_001',
    lastEpisodeId: 'ep_work_001_005',
    lastEpisodeNumber: 5,
    progress: 78,
    lastReadAt: '2026-02-26T09:30:00.000Z',
  },
  {
    workId: 'work_005',
    lastEpisodeId: 'ep_work_005_003',
    lastEpisodeNumber: 3,
    progress: 45,
    lastReadAt: '2026-02-25T21:15:00.000Z',
  },
  {
    workId: 'work_002',
    lastEpisodeId: 'ep_work_002_002',
    lastEpisodeNumber: 2,
    progress: 100,
    lastReadAt: '2026-02-24T18:00:00.000Z',
  },
  {
    workId: 'work_015',
    lastEpisodeId: 'ep_work_015_004',
    lastEpisodeNumber: 4,
    progress: 62,
    lastReadAt: '2026-02-23T14:20:00.000Z',
  },
  {
    workId: 'work_009',
    lastEpisodeId: 'ep_work_009_001',
    lastEpisodeNumber: 1,
    progress: 30,
    lastReadAt: '2026-02-22T10:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// 7. MOCK_BOOKMARKS - Bookmarked works (for My Page)
// ---------------------------------------------------------------------------

export const MOCK_BOOKMARKS: string[] = [
  'work_001',
  'work_002',
  'work_005',
  'work_010',
  'work_015',
  'work_019',
];

// ---------------------------------------------------------------------------
// 8. MOCK_PURCHASES - Purchased episodes (for My Page)
// ---------------------------------------------------------------------------

export interface PurchaseItem {
  id: string;
  workId: string;
  workTitle: string;
  episodeId: string;
  episodeTitle: string;
  price: number;
  purchasedAt: string;
}

export const MOCK_PURCHASES: PurchaseItem[] = [
  {
    id: 'purchase_001',
    workId: 'work_001',
    workTitle: '달빛 아래 사랑의 고백',
    episodeId: 'ep_work_001_004',
    episodeTitle: '제4화 - 변화의 조짐',
    price: 3,
    purchasedAt: '2026-02-25T14:00:00.000Z',
  },
  {
    id: 'purchase_002',
    workId: 'work_001',
    workTitle: '달빛 아래 사랑의 고백',
    episodeId: 'ep_work_001_005',
    episodeTitle: '제5화 - 숨겨진 진실',
    price: 3,
    purchasedAt: '2026-02-25T14:05:00.000Z',
  },
  {
    id: 'purchase_003',
    workId: 'work_005',
    workTitle: '무한 레벨업 시스템',
    episodeId: 'ep_work_005_004',
    episodeTitle: '제4화 - 변화의 조짐',
    price: 3,
    purchasedAt: '2026-02-24T20:30:00.000Z',
  },
  {
    id: 'purchase_004',
    workId: 'work_005',
    workTitle: '무한 레벨업 시스템',
    episodeId: 'ep_work_005_005',
    episodeTitle: '제5화 - 숨겨진 진실',
    price: 3,
    purchasedAt: '2026-02-24T20:35:00.000Z',
  },
  {
    id: 'purchase_005',
    workId: 'work_015',
    workTitle: '13번째 방',
    episodeId: 'ep_work_015_004',
    episodeTitle: '제4화 - 변화의 조짐',
    price: 3,
    purchasedAt: '2026-02-23T11:15:00.000Z',
  },
  {
    id: 'purchase_006',
    workId: 'work_002',
    workTitle: '재벌 3세와 비밀 계약',
    episodeId: 'ep_work_002_004',
    episodeTitle: '제4화 - 변화의 조짐',
    price: 3,
    purchasedAt: '2026-02-22T16:45:00.000Z',
  },
];