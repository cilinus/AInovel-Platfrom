// ---------------------------------------------------------------------------
// Mock API Handler
// Simulates backend API responses using in-memory mock data.
// Returns `null` when no route matches, so callers know to fall through.
// ---------------------------------------------------------------------------

import type { Episode } from '../types/episode';
import type { Comment } from '../types/comment';
import type { RatingStats, EpisodeRatingStats } from '../types/rating';
import {
  MOCK_WORKS,
  MOCK_EPISODES,
  MOCK_USER,
  MOCK_AUTH_RESPONSE,
  MOCK_AUTHOR_USER,
  MOCK_COMMENTS,
  MOCK_RATINGS,
  MOCK_READING_HISTORY,
  MOCK_BOOKMARKS,
  MOCK_PURCHASES,
  type ApiWork,
  generateCoverSvg,
  GENRE_COLORS,
} from './data';

interface MockRequestOptions {
  method?: string;
  body?: string;
  params?: Record<string, string>;
}

// Track the current mock user for role-based switching (login toggles this).
// Persist selection in sessionStorage so it survives page refreshes.
function loadMockUser(): typeof MOCK_USER | typeof MOCK_AUTHOR_USER {
  if (typeof window !== 'undefined') {
    try {
      const saved = sessionStorage.getItem('mock-user-role');
      if (saved === 'AUTHOR') return MOCK_AUTHOR_USER;
    } catch {
      // SSR or storage unavailable
    }
  }
  return MOCK_USER;
}

function saveMockUserRole(user: typeof MOCK_USER | typeof MOCK_AUTHOR_USER) {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('mock-user-role', user.role);
    } catch {
      // ignore
    }
  }
}

let currentMockUser: typeof MOCK_USER | typeof MOCK_AUTHOR_USER = loadMockUser();

// In-memory state for work likes (workId -> liked)
const MOCK_WORK_LIKES: Record<string, boolean> = {};

// In-memory state for episode ratings (workId_episodeId -> stats)
const MOCK_EPISODE_RATINGS: Record<string, EpisodeRatingStats> = {};

// ---------------------------------------------------------------------------
// Route matching helpers
// ---------------------------------------------------------------------------

function parseQueryParams(path: string): { pathname: string; query: Record<string, string> } {
  const [pathname, queryString] = path.split('?');
  const query: Record<string, string> = {};
  if (queryString) {
    queryString.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(value ?? '');
      }
    });
  }
  return { pathname, query };
}

function matchPath(
  pathname: string,
  pattern: RegExp,
  keys: string[],
): Record<string, string> | null {
  const match = pathname.match(pattern);
  if (!match) return null;
  const result: Record<string, string> = {};
  keys.forEach((key, i) => {
    result[key] = match[i + 1] ?? '';
  });
  return result;
}

// ---------------------------------------------------------------------------
// Sorting helpers
// ---------------------------------------------------------------------------

function sortWorks(works: ApiWork[], sort: string): ApiWork[] {
  const sorted = [...works];
  switch (sort) {
    case 'popular':
      return sorted.sort(
        (a, b) =>
          ((b.stats?.viewCount ?? 0) + (b.stats?.likeCount ?? 0)) -
          ((a.stats?.viewCount ?? 0) + (a.stats?.likeCount ?? 0)),
      );
    case 'rating':
      return sorted.sort(
        (a, b) => (b.stats?.averageRating ?? 0) - (a.stats?.averageRating ?? 0),
      );
    case 'latest':
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime(),
      );
  }
}

// ---------------------------------------------------------------------------
// Episode generation for works without pre-built episodes
// ---------------------------------------------------------------------------

function generateEpisodesForWork(
  workId: string,
  episodeCount: number,
): Episode[] {
  const episodes: Episode[] = [];
  const count = Math.min(episodeCount, 5); // cap generated episodes at 5

  for (let i = 1; i <= count; i++) {
    const isFree = i <= 2;
    const baseDate = new Date('2025-06-01T09:00:00Z');
    baseDate.setDate(baseDate.getDate() + (i - 1) * 7);

    episodes.push({
      id: `ep_${workId}_${String(i).padStart(2, '0')}`,
      workId,
      number: i,
      title: i === 1 ? '프롤로그' : `제${i - 1}화`,
      content:
        `[${i === 1 ? '프롤로그' : `제${i - 1}화`}] 의 내용입니다.\n\n` +
        '이것은 목 데이터로 생성된 임시 에피소드 콘텐츠입니다. ' +
        '실제 백엔드가 연결되면 진짜 콘텐츠로 대체됩니다.\n\n' +
        '아직 이야기가 시작되지 않았습니다. 곧 새로운 이야기가 펼쳐질 예정입니다.',
      wordCount: 1500 + i * 300,
      price: isFree ? 0 : 200,
      isFree,
      isPublished: true,
      publishedAt: baseDate.toISOString(),
      viewCount: Math.floor(Math.random() * 10000) + 1000,
      likeCount: Math.floor(Math.random() * 500) + 50,
      commentCount: Math.floor(Math.random() * 100) + 10,
      createdAt: baseDate.toISOString(),
    });
  }

  return episodes;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

function handleGetWorks(
  query: Record<string, string>,
): unknown {
  let filtered = [...MOCK_WORKS];

  // Filter by genre
  if (query.genre) {
    filtered = filtered.filter((w) => w.genre === query.genre);
  }

  // Filter by status
  if (query.status) {
    filtered = filtered.filter((w) => w.status === query.status);
  }

  // Filter by contentType
  if (query.contentType) {
    filtered = filtered.filter((w) => w.contentType === query.contentType);
  }

  // Search by title
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    filtered = filtered.filter(
      (w) =>
        w.title.toLowerCase().includes(searchLower) ||
        (w.description ?? '').toLowerCase().includes(searchLower) ||
        (w.tags ?? []).some((t) => t.toLowerCase().includes(searchLower)),
    );
  }

  // Sort
  const sort = query.sort ?? 'latest';
  filtered = sortWorks(filtered, sort);

  // Paginate
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = Math.max(1, parseInt(query.limit ?? '12', 10));
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}

function handleGetWorkById(workId: string): unknown {
  const work = MOCK_WORKS.find((w) => w._id === workId);
  if (!work) {
    throw new MockNotFoundError(`Work not found: ${workId}`);
  }
  return { ...work, isLiked: !!MOCK_WORK_LIKES[workId] };
}

function handleGetEpisodes(workId: string): unknown {
  const prebuilt = MOCK_EPISODES[workId];
  if (prebuilt && prebuilt.length > 0) {
    return prebuilt;
  }

  // Generate episodes on the fly based on the work's episodeCount
  const work = MOCK_WORKS.find((w) => w._id === workId);
  if (!work) {
    throw new MockNotFoundError(`Work not found: ${workId}`);
  }

  return generateEpisodesForWork(workId, work.episodeCount ?? 3);
}

function handleGetEpisodeById(
  workId: string,
  episodeId: string,
): unknown {
  // Try pre-built first
  const prebuilt = MOCK_EPISODES[workId];
  if (prebuilt) {
    const episode = prebuilt.find((e) => e.id === episodeId);
    if (episode) return episode;
  }

  // Try to match by parsing the episode id for a number
  const numMatch = episodeId.match(/(\d+)$/);
  const episodeNumber = numMatch ? parseInt(numMatch[1], 10) : 1;

  const work = MOCK_WORKS.find((w) => w._id === workId);
  if (!work) {
    throw new MockNotFoundError(`Work not found: ${workId}`);
  }

  const isFree = episodeNumber <= 2;
  const baseDate = new Date('2025-06-01T09:00:00Z');
  baseDate.setDate(baseDate.getDate() + (episodeNumber - 1) * 7);

  return {
    id: episodeId,
    workId,
    number: episodeNumber,
    title: episodeNumber === 1 ? '프롤로그' : `제${episodeNumber - 1}화`,
    content:
      `[${episodeNumber === 1 ? '프롤로그' : `제${episodeNumber - 1}화`}] 의 내용입니다.\n\n` +
      '이것은 목 데이터로 생성된 임시 에피소드 콘텐츠입니다. ' +
      '실제 백엔드가 연결되면 진짜 콘텐츠로 대체됩니다.',
    wordCount: 2000,
    price: isFree ? 0 : 200,
    isFree,
    isPublished: true,
    publishedAt: baseDate.toISOString(),
    viewCount: Math.floor(Math.random() * 5000) + 500,
    likeCount: Math.floor(Math.random() * 300) + 30,
    commentCount: Math.floor(Math.random() * 50) + 5,
    createdAt: baseDate.toISOString(),
  } satisfies Episode;
}

// ---------------------------------------------------------------------------
// Custom error for 404 responses
// ---------------------------------------------------------------------------

class MockNotFoundError extends Error {
  public statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = 'MockNotFoundError';
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

/**
 * Simulates an API response for the given path and options.
 *
 * @returns The mock response data, or `null` if no route matches.
 * @throws MockNotFoundError when a resource is not found (404).
 */
export function handleMockRequest(
  path: string,
  options?: MockRequestOptions,
): unknown | null {
  const method = (options?.method ?? 'GET').toUpperCase();
  const { pathname, query } = parseQueryParams(path);

  // Merge explicit params into query
  if (options?.params) {
    Object.assign(query, options.params);
  }

  // -----------------------------------------------------------------------
  // AUTH routes
  // -----------------------------------------------------------------------
  if (method === 'POST' && pathname === '/auth/login') {
    const body = options?.body ? JSON.parse(options.body) : {};
    if (body.email === 'author@ainovel.com') {
      currentMockUser = MOCK_AUTHOR_USER;
    } else {
      currentMockUser = MOCK_USER;
    }
    saveMockUserRole(currentMockUser);
    return MOCK_AUTH_RESPONSE;
  }

  if (method === 'POST' && pathname === '/auth/register') {
    const body = options?.body ? JSON.parse(options.body) : {};
    if (body.email === 'author@ainovel.com') {
      currentMockUser = MOCK_AUTHOR_USER;
    } else {
      currentMockUser = MOCK_USER;
    }
    saveMockUserRole(currentMockUser);
    return MOCK_AUTH_RESPONSE;
  }

  // -----------------------------------------------------------------------
  // USER routes
  // -----------------------------------------------------------------------
  if (method === 'GET' && pathname === '/users/me') {
    return currentMockUser;
  }

  // GET /users/me/reading-history
  if (method === 'GET' && pathname === '/users/me/reading-history') {
    return MOCK_READING_HISTORY;
  }

  // GET /users/me/bookmarks
  if (method === 'GET' && pathname === '/users/me/bookmarks') {
    const bookmarkedWorks = MOCK_WORKS.filter((w) => MOCK_BOOKMARKS.includes(w._id));
    return { items: bookmarkedWorks, total: bookmarkedWorks.length };
  }

  // GET /users/me/bookmarks/:workId/status
  const bookmarkStatusMatch = matchPath(pathname, /^\/users\/me\/bookmarks\/([^/]+)\/status$/, ['workId']);
  if (method === 'GET' && bookmarkStatusMatch) {
    const isBookmarked = MOCK_BOOKMARKS.includes(bookmarkStatusMatch.workId);
    return { bookmarked: isBookmarked };
  }

  // POST /users/me/bookmarks/:workId (toggle)
  const bookmarkToggleMatch = matchPath(pathname, /^\/users\/me\/bookmarks\/([^/]+)$/, ['workId']);
  if (method === 'POST' && bookmarkToggleMatch) {
    const wId = bookmarkToggleMatch.workId;
    const idx = MOCK_BOOKMARKS.indexOf(wId);
    if (idx >= 0) {
      MOCK_BOOKMARKS.splice(idx, 1);
      return { bookmarked: false };
    } else {
      MOCK_BOOKMARKS.push(wId);
      return { bookmarked: true };
    }
  }

  // GET /users/me/purchases
  if (method === 'GET' && pathname === '/users/me/purchases') {
    return { items: MOCK_PURCHASES, total: MOCK_PURCHASES.length };
  }

  // -----------------------------------------------------------------------
  // AUTHOR routes
  // -----------------------------------------------------------------------

  // GET /author/works — works filtered by current author
  if (method === 'GET' && pathname === '/author/works') {
    const authorWorks = MOCK_WORKS.filter(
      (w) => w.authorId?.nickname === currentMockUser.nickname,
    );
    return { items: authorWorks, total: authorWorks.length };
  }

  // -----------------------------------------------------------------------
  // WORKS routes
  // -----------------------------------------------------------------------

  // POST /works/:workId/episodes/:episodeId/comments/:commentId/like
  const commentLikeMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes\/([^/]+)\/comments\/([^/]+)\/like$/,
    ['workId', 'episodeId', 'commentId'],
  );
  if (method === 'POST' && commentLikeMatch) {
    const epId = commentLikeMatch.episodeId;
    const commentId = commentLikeMatch.commentId;
    const allComments = MOCK_COMMENTS[epId] ?? [];
    // Search top-level and replies
    let target: Comment | undefined;
    for (const c of allComments) {
      if (c.id === commentId) { target = c; break; }
      if (c.replies) {
        const found = c.replies.find((r) => r.id === commentId);
        if (found) { target = found; break; }
      }
    }
    if (target) {
      target.isLiked = !target.isLiked;
      target.likeCount = target.isLiked ? target.likeCount + 1 : Math.max(0, target.likeCount - 1);
      return { id: target.id, likeCount: target.likeCount, isLiked: target.isLiked };
    }
    return { id: commentId, likeCount: 0, isLiked: false };
  }

  // POST /works/:workId/episodes/:episodeId/comments/:commentId/dislike
  const commentDislikeMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes\/([^/]+)\/comments\/([^/]+)\/dislike$/,
    ['workId', 'episodeId', 'commentId'],
  );
  if (method === 'POST' && commentDislikeMatch) {
    const epId = commentDislikeMatch.episodeId;
    const commentId = commentDislikeMatch.commentId;
    const allComments = MOCK_COMMENTS[epId] ?? [];
    let target: Comment | undefined;
    for (const c of allComments) {
      if (c.id === commentId) { target = c; break; }
      if (c.replies) {
        const found = c.replies.find((r) => r.id === commentId);
        if (found) { target = found; break; }
      }
    }
    if (target) {
      target.isDisliked = !target.isDisliked;
      target.dislikeCount = target.isDisliked ? target.dislikeCount + 1 : Math.max(0, target.dislikeCount - 1);
      return { id: target.id, dislikeCount: target.dislikeCount, isDisliked: target.isDisliked };
    }
    return { id: commentId, dislikeCount: 0, isDisliked: false };
  }

  // GET/POST /works/:workId/episodes/:episodeId/comments  (MUST be before episode detail)
  const commentsGetMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes\/([^/]+)\/comments$/,
    ['workId', 'episodeId'],
  );
  if (method === 'GET' && commentsGetMatch) {
    const epId = commentsGetMatch.episodeId;
    const allComments = MOCK_COMMENTS[epId] ?? [];

    // Filter top-level comments (parentId is null) and attach replies
    const topLevel = allComments.filter((c) => c.parentId === null || c.parentId === undefined);
    const topLevelWithReplies = topLevel.map((c) => ({
      ...c,
      replies: allComments.filter((r) => r.parentId === c.id),
    }));

    // Sort
    const sortBy = query.sort ?? 'latest';
    let sorted = [...topLevelWithReplies];
    if (sortBy === 'best') {
      sorted.sort((a, b) => b.likeCount - a.likeCount);
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.max(1, parseInt(query.limit ?? '20', 10));
    const total = sorted.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const items = sorted.slice(start, start + limit);
    return { items, total, page, limit, totalPages, hasNext: page < totalPages };
  }

  const commentsPostMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes\/([^/]+)\/comments$/,
    ['workId', 'episodeId'],
  );
  if (method === 'POST' && commentsPostMatch) {
    const body = options?.body ? JSON.parse(options.body) : {};
    const epId = commentsPostMatch.episodeId;
    const wId = commentsPostMatch.workId;
    if (!MOCK_COMMENTS[epId]) {
      MOCK_COMMENTS[epId] = [];
    }
    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      episodeId: epId,
      workId: wId,
      userId: currentMockUser.id,
      nickname: currentMockUser.nickname,
      content: body.content ?? '',
      likeCount: 0,
      isLiked: false,
      dislikeCount: 0,
      isDisliked: false,
      parentId: body.parentId ?? null,
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_COMMENTS[epId].unshift(newComment);
    return newComment;
  }

  // POST /works/:workId/like (toggle)
  const workLikeMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/like$/,
    ['workId'],
  );
  if (method === 'POST' && workLikeMatch) {
    const wId = workLikeMatch.workId;
    const work = MOCK_WORKS.find((w) => w._id === wId);
    if (!work) throw new MockNotFoundError(`Work not found: ${wId}`);
    if (!work.stats) {
      work.stats = { viewCount: 0, likeCount: 0, bookmarkCount: 0, averageRating: 0, ratingCount: 0 };
    }
    // Toggle: use a simple in-memory set to track liked status
    if (!MOCK_WORK_LIKES[wId]) {
      MOCK_WORK_LIKES[wId] = true;
      work.stats.likeCount = (work.stats.likeCount ?? 0) + 1;
      return { liked: true, likeCount: work.stats.likeCount };
    } else {
      delete MOCK_WORK_LIKES[wId];
      work.stats.likeCount = Math.max(0, (work.stats.likeCount ?? 0) - 1);
      return { liked: false, likeCount: work.stats.likeCount };
    }
  }

  // GET/POST /works/:workId/episodes/:episodeId/ratings
  const episodeRatingsGetMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes\/([^/]+)\/ratings$/,
    ['workId', 'episodeId'],
  );
  if (method === 'GET' && episodeRatingsGetMatch) {
    const key = `${episodeRatingsGetMatch.workId}_${episodeRatingsGetMatch.episodeId}`;
    const stats = MOCK_EPISODE_RATINGS[key];
    if (!stats) {
      return {
        episodeId: episodeRatingsGetMatch.episodeId,
        workId: episodeRatingsGetMatch.workId,
        averageRating: 0,
        ratingCount: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        userRating: null,
      };
    }
    return stats;
  }

  const episodeRatingsPostMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes\/([^/]+)\/ratings$/,
    ['workId', 'episodeId'],
  );
  if (method === 'POST' && episodeRatingsPostMatch) {
    const body = options?.body ? JSON.parse(options.body) : {};
    const wId = episodeRatingsPostMatch.workId;
    const epId = episodeRatingsPostMatch.episodeId;
    const key = `${wId}_${epId}`;
    const score = body.score ?? 5;
    if (!MOCK_EPISODE_RATINGS[key]) {
      MOCK_EPISODE_RATINGS[key] = {
        episodeId: epId,
        workId: wId,
        averageRating: score,
        ratingCount: 1,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        userRating: score,
      };
      MOCK_EPISODE_RATINGS[key].distribution[score] = 1;
    } else {
      const r = MOCK_EPISODE_RATINGS[key];
      if (r.userRating !== null) {
        r.distribution[r.userRating] = Math.max(0, (r.distribution[r.userRating] ?? 0) - 1);
        r.distribution[score] = (r.distribution[score] ?? 0) + 1;
      } else {
        r.ratingCount += 1;
        r.distribution[score] = (r.distribution[score] ?? 0) + 1;
      }
      const total = Object.entries(r.distribution).reduce(
        (sum, [star, count]) => sum + Number(star) * count,
        0,
      );
      r.averageRating = Math.round((total / r.ratingCount) * 10) / 10;
      r.userRating = score;
    }
    return MOCK_EPISODE_RATINGS[key];
  }

  // GET /works/:workId/episodes/:episodeId/navigation
  const navMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes\/([^/]+)\/navigation$/,
    ['workId', 'episodeId'],
  );
  if (method === 'GET' && navMatch) {
    const allEps = (() => {
      const prebuilt = MOCK_EPISODES[navMatch.workId];
      if (prebuilt && prebuilt.length > 0) return prebuilt;
      const work = MOCK_WORKS.find((w) => w._id === navMatch.workId);
      if (!work) return [];
      return generateEpisodesForWork(navMatch.workId, work.episodeCount ?? 3);
    })();
    const currentEp = allEps.find((e) => e.id === navMatch.episodeId);
    const currentNumber = currentEp?.number ?? 1;
    const sorted = [...allEps].sort((a, b) => a.number - b.number);
    const prevEp = sorted.filter((e) => e.number < currentNumber).pop() ?? null;
    const nextEp = sorted.find((e) => e.number > currentNumber) ?? null;
    return {
      prev: prevEp ? { id: prevEp.id, number: prevEp.number, title: prevEp.title } : null,
      next: nextEp ? { id: nextEp.id, number: nextEp.number, title: nextEp.title } : null,
    };
  }

  // GET /works/:workId/episodes/:episodeId
  const episodeDetailMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes\/([^/]+)$/,
    ['workId', 'episodeId'],
  );
  if (method === 'GET' && episodeDetailMatch) {
    return handleGetEpisodeById(
      episodeDetailMatch.workId,
      episodeDetailMatch.episodeId,
    );
  }

  // GET/POST /works/:workId/ratings  (MUST be before episode list)
  const ratingsGetMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/ratings$/,
    ['workId'],
  );
  if (method === 'GET' && ratingsGetMatch) {
    const stats = MOCK_RATINGS[ratingsGetMatch.workId];
    if (!stats) {
      return { workId: ratingsGetMatch.workId, averageRating: 0, ratingCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, userRating: null };
    }
    return stats;
  }

  const ratingsPostMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/ratings$/,
    ['workId'],
  );
  if (method === 'POST' && ratingsPostMatch) {
    const body = options?.body ? JSON.parse(options.body) : {};
    const wId = ratingsPostMatch.workId;
    const score = body.score ?? 5;
    if (!MOCK_RATINGS[wId]) {
      MOCK_RATINGS[wId] = { workId: wId, averageRating: score, ratingCount: 1, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, userRating: score };
      MOCK_RATINGS[wId].distribution[score] = 1;
    } else {
      const r = MOCK_RATINGS[wId];
      if (r.userRating !== null) {
        // Update existing rating
        r.distribution[r.userRating] = Math.max(0, (r.distribution[r.userRating] ?? 0) - 1);
        r.distribution[score] = (r.distribution[score] ?? 0) + 1;
      } else {
        r.ratingCount += 1;
        r.distribution[score] = (r.distribution[score] ?? 0) + 1;
      }
      const total = Object.entries(r.distribution).reduce((sum, [star, count]) => sum + Number(star) * count, 0);
      r.averageRating = Math.round((total / r.ratingCount) * 10) / 10;
      r.userRating = score;
    }
    return MOCK_RATINGS[wId];
  }

  // PATCH /works/:workId/episodes/reorder — reorder episodes
  const reorderMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes\/reorder$/,
    ['workId'],
  );
  if (method === 'PATCH' && reorderMatch) {
    const body = options?.body ? JSON.parse(options.body) : {};
    const wId = reorderMatch.workId;
    if (!MOCK_EPISODES[wId]) {
      MOCK_EPISODES[wId] = [];
    }
    const eps = MOCK_EPISODES[wId];
    const orders: { episodeId: string; episodeNumber: number }[] = body.orders ?? [];
    for (const order of orders) {
      const ep = eps.find((e) => e.id === order.episodeId);
      if (ep) {
        ep.number = order.episodeNumber;
      }
    }
    eps.sort((a, b) => a.number - b.number);
    return { success: true };
  }

  // GET /works/:workId/episodes/author — all episodes for author (no isPublished filter)
  const authorEpisodesMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes\/author$/,
    ['workId'],
  );
  if (method === 'GET' && authorEpisodesMatch) {
    const wId = authorEpisodesMatch.workId;
    const prebuilt = MOCK_EPISODES[wId];
    let allEps: Episode[];
    if (prebuilt && prebuilt.length > 0) {
      allEps = prebuilt;
    } else {
      const work = MOCK_WORKS.find((w) => w._id === wId);
      if (!work) throw new MockNotFoundError(`Work not found: ${wId}`);
      allEps = generateEpisodesForWork(wId, work.episodeCount ?? 3);
    }
    const sorted = [...allEps].sort((a, b) => a.number - b.number);
    // Return in backend format with _id and episodeNumber fields
    const items = sorted.map((ep) => ({
      _id: ep.id,
      workId: ep.workId,
      episodeNumber: ep.number,
      title: ep.title,
      wordCount: ep.wordCount,
      isPublished: ep.isPublished,
      isFree: ep.isFree,
      price: ep.price,
      createdAt: ep.createdAt,
    }));
    return { items, total: items.length, page: 1, limit: 100 };
  }

  // POST /works/:workId/episodes — create a new episode
  const episodeCreateMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes$/,
    ['workId'],
  );
  if (method === 'POST' && episodeCreateMatch) {
    const body = options?.body ? JSON.parse(options.body) : {};
    const wId = episodeCreateMatch.workId;
    const work = MOCK_WORKS.find((w) => w._id === wId);
    if (!work) throw new MockNotFoundError(`Work not found: ${wId}`);

    if (!MOCK_EPISODES[wId]) {
      MOCK_EPISODES[wId] = [];
    }
    const existingEps = MOCK_EPISODES[wId];

    // Insert-at-position support
    const insertPos: number | undefined = body.episodeNumber;
    let newNumber: number;
    if (insertPos !== undefined && insertPos >= 1 && insertPos <= existingEps.length + 1) {
      // Shift existing episodes at and after insertPos
      for (const ep of existingEps) {
        if (ep.number >= insertPos) {
          ep.number += 1;
        }
      }
      newNumber = insertPos;
    } else {
      newNumber = existingEps.length + 1;
    }

    const newEpisode = {
      id: `ep_${wId}_${String(Date.now()).slice(-6)}`,
      workId: wId,
      number: newNumber,
      title: body.title ?? `제${newNumber}화`,
      content: body.content ?? '',
      wordCount: (body.content ?? '').length,
      price: body.isFree ? 0 : (body.price ?? 3),
      isFree: body.isFree ?? false,
      isPublished: body.publishNow ?? true,
      publishedAt: new Date().toISOString(),
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      authorNote: body.authorNote,
      createdAt: new Date().toISOString(),
    };
    existingEps.push(newEpisode);
    existingEps.sort((a, b) => a.number - b.number);
    work.episodeCount = (work.episodeCount ?? 0) + 1;
    return newEpisode;
  }

  // GET /works/:workId/episodes
  const episodesMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)\/episodes$/,
    ['workId'],
  );
  if (method === 'GET' && episodesMatch) {
    return handleGetEpisodes(episodesMatch.workId);
  }

  // POST /works — create a new work  (MUST be before GET /works/:id)
  const worksPostMatch = method === 'POST' && pathname === '/works';
  if (worksPostMatch) {
    const body = options?.body ? JSON.parse(options.body) : {};
    const colors = GENRE_COLORS[body.genre] ?? ['#6366f1', '#8b5cf6'];
    const newWork: ApiWork = {
      _id: `work_${String(MOCK_WORKS.length + 1).padStart(3, '0')}`,
      title: body.title,
      description: body.synopsis,
      coverImage: generateCoverSvg(body.title, colors[0], colors[1]),
      genre: body.genre,
      tags: body.tags ?? [],
      status: 'ONGOING',
      contentType: 'HUMAN',
      isAiGenerated: false,
      episodeCount: 0,
      stats: { viewCount: 0, likeCount: 0, bookmarkCount: 0, averageRating: 0, ratingCount: 0 },
      authorId: { nickname: currentMockUser.nickname },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_WORKS.push(newWork);
    return newWork;
  }

  // GET /works/:id
  const workDetailMatch = matchPath(
    pathname,
    /^\/works\/([^/]+)$/,
    ['id'],
  );
  if (method === 'GET' && workDetailMatch) {
    return handleGetWorkById(workDetailMatch.id);
  }

  // GET /works
  if (method === 'GET' && pathname === '/works') {
    return handleGetWorks(query);
  }

  // -----------------------------------------------------------------------
  // No match
  // -----------------------------------------------------------------------
  return null;
}