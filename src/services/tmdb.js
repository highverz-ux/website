/**
 * HIGHVERZ — TMDB API Service Layer
 * Clean, reusable functions for fetching movie data from The Movie Database.
 * Uses import.meta.env.VITE_TMDB_API_KEY (Vite env variable).
 */

import { browserCache } from './cache.js';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const TMDB_DEFAULT_KEY = '4f2cf009f072ced9e20e584803d8400e';
const TMDB_DEFAULT_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0ZjJjZjAwOWYwNzJjZWQ5ZTIwZTU4NDgwM2Q4NDAwZSIsIm5iZiI6MTc4OTE0NjEyOS42NjYsInN1YiI6IjZhYTQzNDExNTUwMWRmZjhiZjI4OWNmYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.MDPNXL50yjs5FXCTDFh-PPg_AmPlxkf_8C16mVB8XG8';

function getAuth() {
  const token = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TMDB_ACCESS_TOKEN) || TMDB_DEFAULT_TOKEN;
  const key = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TMDB_API_KEY) || TMDB_DEFAULT_KEY;

  if (token && token.startsWith('eyJ')) {
    return { type: 'bearer', token };
  }
  if (key && key !== 'your_tmdb_api_key_here') {
    if (key.startsWith('eyJ')) {
      return { type: 'bearer', token: key };
    }
    return { type: 'key', key };
  }
  return { type: 'bearer', token: TMDB_DEFAULT_TOKEN };
}

/**
 * Core fetch wrapper with multi-tier browser caching and error handling
 */
async function tmdbFetch(endpoint, params = {}) {
  const auth = getAuth();
  if (!auth) {
    throw new Error('TMDB API credentials not configured');
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  const headers = { 'Accept': 'application/json' };

  if (auth.type === 'bearer') {
    headers['Authorization'] = `Bearer ${auth.token}`;
  } else {
    url.searchParams.set('api_key', auth.key);
  }

  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, val]) => {
    if (val !== undefined && val !== null) {
      url.searchParams.set(k, String(val));
    }
  });

  const cacheKey = `tmdb_${endpoint}_${url.searchParams.toString()}`;

  // Check multi-tier browser cache
  const cached = browserCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`TMDB API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  // Store in browser cache
  browserCache.set(cacheKey, data, CACHE_TTL);

  return data;
}

// ─── Image URL Helpers ───

/**
 * Build a TMDB image URL.
 * @param {string} path - The image path from TMDB (e.g. "/abc123.jpg")
 * @param {'w200'|'w300'|'w500'|'w780'|'w1280'|'original'} size
 * @returns {string|null}
 */
export function getImageUrl(path, size = 'w780') {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

/**
 * Get poster URL with appropriate size.
 */
export function getPosterUrl(path, size = 'w500') {
  return getImageUrl(path, size);
}

/**
 * Get backdrop URL (wide cinematic image).
 */
export function getBackdropUrl(path, size = 'w1280') {
  return getImageUrl(path, size);
}

// ─── Movie List Endpoints ───

/**
 * Get popular movies.
 * @param {number} page
 * @returns {Promise<{results: Array, total_pages: number, total_results: number}>}
 */
export async function getPopularMovies(page = 1) {
  return tmdbFetch('/movie/popular', { page });
}

/**
 * Get trending movies.
 * @param {'day'|'week'} timeWindow
 * @returns {Promise<{results: Array}>}
 */
export async function getTrendingMovies(timeWindow = 'week') {
  return tmdbFetch(`/trending/movie/${timeWindow}`);
}

/**
 * Get now playing movies.
 * @param {number} page
 */
export async function getNowPlayingMovies(page = 1) {
  return tmdbFetch('/movie/now_playing', { page });
}

/**
 * Get top rated movies.
 * @param {number} page
 */
export async function getTopRatedMovies(page = 1) {
  return tmdbFetch('/movie/top_rated', { page });
}

// ─── Movie Detail Endpoints ───

/**
 * Get full movie details.
 * @param {number} id - TMDB movie ID
 */
export async function getMovieDetails(id) {
  return tmdbFetch(`/movie/${id}`);
}

/**
 * Get movie cast and crew.
 * @param {number} id
 */
export async function getMovieCredits(id) {
  return tmdbFetch(`/movie/${id}/credits`);
}

/**
 * Get movie videos (trailers, teasers, BTS).
 * @param {number} id
 */
export async function getMovieVideos(id) {
  return tmdbFetch(`/movie/${id}/videos`);
}

/**
 * Get similar movies.
 * @param {number} id
 */
export async function getSimilarMovies(id) {
  return tmdbFetch(`/movie/${id}/similar`);
}

// ─── Search ───

/**
 * Search movies by query string.
 * @param {string} query
 * @param {number} page
 */
export async function searchMovies(query, page = 1) {
  if (!query || query.trim().length === 0) {
    return { results: [], total_pages: 0, total_results: 0 };
  }
  return tmdbFetch('/search/movie', { query: query.trim(), page });
}

// ─── Utility ───

/**
 * Extract the year from a release date string.
 * @param {string} dateStr - e.g. "2023-07-21"
 * @returns {string}
 */
export function extractYear(dateStr) {
  if (!dateStr) return '—';
  return dateStr.split('-')[0];
}

/**
 * Format runtime from minutes to "Xh Ym".
 * @param {number} minutes
 * @returns {string}
 */
export function formatRuntime(minutes) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Format vote average to one decimal.
 * @param {number} vote
 * @returns {string}
 */
export function formatRating(vote) {
  if (!vote) return '—';
  return vote.toFixed(1);
}

/**
 * Get genre names as a comma-separated string.
 * @param {Array<{id: number, name: string}>} genres
 * @param {number} max - Maximum genres to show
 * @returns {string}
 */
export function formatGenres(genres, max = 3) {
  if (!genres || genres.length === 0) return '—';
  return genres.slice(0, max).map(g => g.name).join(' · ');
}

/**
 * Get the director from a credits object.
 * @param {{crew: Array}} credits
 * @returns {string}
 */
export function getDirector(credits) {
  if (!credits || !credits.crew) return '—';
  const director = credits.crew.find(c => c.job === 'Director');
  return director ? director.name : '—';
}

/**
 * Get top cast members.
 * @param {{cast: Array}} credits
 * @param {number} count
 * @returns {Array<{name: string, character: string, profile_path: string}>}
 */
export function getTopCast(credits, count = 6) {
  if (!credits || !credits.cast) return [];
  return credits.cast.slice(0, count);
}

/**
 * Find the best trailer from videos results.
 * Prioritizes Official Trailer, then Trailer, then Teaser.
 * @param {{results: Array}} videos
 * @returns {{key: string, name: string, site: string, type: string}|null}
 */
export function getBestTrailer(videos) {
  if (!videos || !videos.results || videos.results.length === 0) return null;
  const ytVideos = videos.results.filter(v => v.site === 'YouTube');

  // Priority: Official Trailer > Trailer > Teaser > any
  const official = ytVideos.find(v => v.type === 'Trailer' && v.official);
  if (official) return official;

  const trailer = ytVideos.find(v => v.type === 'Trailer');
  if (trailer) return trailer;

  const teaser = ytVideos.find(v => v.type === 'Teaser');
  if (teaser) return teaser;

  return ytVideos[0] || null;
}

/**
 * Check if TMDB API credentials are configured.
 * @returns {boolean}
 */
export function isApiKeyConfigured() {
  return getAuth() !== null;
}

/**
 * Fetch paginated movies from backend API with debouncing / cancellation support.
 * Falls back to client-side TMDB or offline mocks if backend is unavailable.
 * @param {object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=12]
 * @param {string} [options.query='']
 * @param {string} [options.filter='all']
 * @param {AbortSignal} [options.signal=null]
 * @returns {Promise<{success: boolean, page: number, limit: number, total_results: number, total_pages: number, results: Array}>}
 */
export async function fetchBackendMovies({ page = 1, limit = 12, query = '', filter = 'all', genre = 'all', year = 'all', sortBy = 'popularity.desc', signal = null } = {}) {
  const cacheKey = `backend_movies_p${page}_l${limit}_f${filter}_g${genre}_y${year}_s${sortBy}_q${encodeURIComponent(query.toLowerCase().trim())}`;

  // Check browser-level cache first (0ms, eliminates unwanted network calls)
  const cached = browserCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL('/api/movies', window.location.origin);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  if (query) url.searchParams.set('query', query);
  if (filter && filter !== 'all') url.searchParams.set('filter', filter);
  if (genre && genre !== 'all') url.searchParams.set('genre', genre);
  if (year && year !== 'all') url.searchParams.set('year', year);
  if (sortBy && sortBy !== 'popularity.desc') url.searchParams.set('sortBy', sortBy);

  try {
    const response = await fetch(url.toString(), {
      signal,
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success) {
      browserCache.set(cacheKey, data, 10 * 60 * 1000); // 10 minutes TTL
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.warn('[TMDB Service] Backend fetch fallback triggered:', err.message);

    // Fallback directly to client-side TMDB if backend is unavailable
    if (query && query.length > 0) {
      const searchRes = await searchMovies(query, page);
      const results = (searchRes.results || []).slice(0, limit);
      const data = {
        success: true,
        page,
        limit,
        total_results: searchRes.total_results || results.length,
        total_pages: searchRes.total_pages || Math.max(1, Math.ceil((searchRes.total_results || results.length) / limit)),
        results
      };
      browserCache.set(cacheKey, data, 10 * 60 * 1000);
      return data;
    }

    const trending = await getTrendingMovies('week');
    const all = trending.results || [];
    const startIndex = (page - 1) * limit;
    const results = all.slice(startIndex, startIndex + limit);
    const data = {
      success: true,
      page,
      limit,
      total_results: all.length,
      total_pages: Math.max(1, Math.ceil(all.length / limit)),
      results
    };
    browserCache.set(cacheKey, data, 10 * 60 * 1000);
    return data;
  }
}

