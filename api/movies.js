import https from 'https';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_DEFAULT_KEY = '4f2cf009f072ced9e20e584803d8400e';
const TMDB_DEFAULT_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0ZjJjZjAwOWYwNzJjZWQ5ZTIwZTU4NDgwM2Q4NDAwZSIsIm5iZiI6MTc4OTE0NjEyOS42NjYsInN1YiI6IjZhYTQzNDExNTUwMWRmZjhiZjI4OWNmYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.MDPNXL50yjs5FXCTDFh-PPg_AmPlxkf_8C16mVB8XG8';
const tmdbCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

// TMDB caps at 500 pages internally (10,000 results). Prevent impossible page numbers.
const MAX_TMDB_PAGES = 500;

const FEATURED_CAMPAIGN_IDS = [
  693134, // Dune: Part Two
  346698, // Barbie
  872585, // Oppenheimer
  856289, // Jawan
  569094, // Spider-Man: Across the Spider-Verse
  545611, // Everything Everywhere All at Once
  787699, // Animal
  533535  // Deadpool & Wolverine
];

const CAMPAIGN_LABELS = {
  693134: 'DISTRIBUTION ANALYSIS',
  346698: 'CULTURAL IMPACT',
  872585: 'MARKETING CASE STUDY',
  856289: 'CAMPAIGN BREAKDOWN',
  569094: 'DISTRIBUTION ANALYSIS',
  545611: 'CULTURAL IMPACT',
  787699: 'CAMPAIGN BREAKDOWN',
  533535: 'MARKETING CASE STUDY'
};

function getTMDBAuth() {
  const token = (typeof process !== 'undefined' && (process.env?.VITE_TMDB_ACCESS_TOKEN || process.env?.TMDB_ACCESS_TOKEN)) || TMDB_DEFAULT_TOKEN;
  const key = (typeof process !== 'undefined' && (process.env?.VITE_TMDB_API_KEY || process.env?.TMDB_API_KEY)) || TMDB_DEFAULT_KEY;

  if (token && token.startsWith('eyJ')) {
    return { type: 'bearer', token };
  }
  return { type: 'key', key };
}

const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 5, timeout: 10000 });

function nativeHttpsRequest(urlStr, headers = {}, retries = 3) {
  return new Promise((resolve, reject) => {
    function attempt(n) {
      const u = new URL(urlStr);
      const req = https.request(u, {
        method: 'GET',
        agent: httpsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          ...headers
        },
        timeout: 9000
      }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(raw));
            } catch (e) {
              reject(e);
            }
          } else if (res.statusCode === 429 && n > 0) {
            setTimeout(() => attempt(n - 1), 400);
          } else {
            const err = new Error(`TMDB error ${res.statusCode}: ${raw.slice(0, 150)}`);
            err.statusCode = res.statusCode;
            if (n > 0 && res.statusCode >= 500) {
              setTimeout(() => attempt(n - 1), 300);
            } else {
              reject(err);
            }
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        if (n > 0) setTimeout(() => attempt(n - 1), 200);
        else reject(new Error('TMDB connection timed out'));
      });

      req.on('error', (err) => {
        if (n > 0) setTimeout(() => attempt(n - 1), 200);
        else reject(err);
      });

      req.end();
    }
    attempt(retries);
  });
}

async function fetchFromTMDB(endpoint, params = {}) {
  const auth = getTMDBAuth();
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  const headers = {};

  if (auth.type === 'bearer') {
    headers['Authorization'] = `Bearer ${auth.token}`;
  } else {
    url.searchParams.set('api_key', auth.key);
  }

  url.searchParams.set('language', 'en-US');
  // Always exclude adult content from TMDB results
  if (!params.hasOwnProperty('include_adult')) {
    url.searchParams.set('include_adult', 'false');
  }
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v));
    }
  }

  const cacheKey = url.toString();
  const cached = tmdbCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const data = await nativeHttpsRequest(url.toString(), headers, 3);
  tmdbCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/**
 * Filter out adult-flagged movies as a server-side safety net.
 */
function filterAdultContent(movies) {
  if (!Array.isArray(movies)) return [];
  return movies.filter(m => m && m.adult !== true);
}

/**
 * Cap total pages to TMDB's realistic maximum.
 */
function capTotalPages(totalResults, limit) {
  const cappedResults = Math.min(Math.max(0, totalResults), MAX_TMDB_PAGES * limit);
  return Math.max(1, Math.ceil(cappedResults / limit));
}

function capTotalResults(totalResults, limit) {
  return Math.min(Math.max(0, totalResults), MAX_TMDB_PAGES * limit);
}

function enrichMovie(movie) {
  if (!movie) return null;
  const id = Number(movie.id);
  const isFeatured = FEATURED_CAMPAIGN_IDS.includes(id);
  return {
    ...movie,
    hasCampaign: isFeatured,
    campaignLabel: isFeatured ? (CAMPAIGN_LABELS[id] || 'CAMPAIGN BREAKDOWN') : null
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;

    if (id) {
      res.setHeader('Cache-Control', 'public, s-maxage=1800, max-age=1800, stale-while-revalidate=3600');
      const movie = await fetchFromTMDB(`/movie/${id}`, { append_to_response: 'videos,credits' });
      return res.status(200).json({ success: true, movie: enrichMovie(movie) });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300, max-age=300, stale-while-revalidate=600');
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(24, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const query = (req.query.query || '').trim();
    const filter = (req.query.filter || 'all').toLowerCase();
    const genre = (req.query.genre || 'all').trim();
    const year = (req.query.year || 'all').trim();
    const sortBy = (req.query.sortBy || 'popularity.desc').trim();

    // Helper: filter a list of movies by genre and year in-memory
    const applyInMemoryFilters = (movies) => {
      let filtered = movies;
      if (genre !== 'all' && !isNaN(Number(genre))) {
        const gNum = Number(genre);
        filtered = filtered.filter(m => 
          (Array.isArray(m.genre_ids) && m.genre_ids.includes(gNum)) ||
          (Array.isArray(m.genres) && m.genres.some(g => g.id === gNum))
        );
      }
      if (year !== 'all') {
        if (/^\d{4}$/.test(year)) {
          filtered = filtered.filter(m => m.release_date?.startsWith(year));
        } else if (year === '2015-2018') {
          filtered = filtered.filter(m => {
            const y = parseInt(m.release_date?.substring(0, 4), 10);
            return y >= 2015 && y <= 2018;
          });
        } else if (year === '2010-2014') {
          filtered = filtered.filter(m => {
            const y = parseInt(m.release_date?.substring(0, 4), 10);
            return y >= 2010 && y <= 2014;
          });
        } else if (year === '2000-2009') {
          filtered = filtered.filter(m => {
            const y = parseInt(m.release_date?.substring(0, 4), 10);
            return y >= 2000 && y <= 2009;
          });
        } else if (year === 'pre-2000') {
          filtered = filtered.filter(m => {
            const y = parseInt(m.release_date?.substring(0, 4), 10);
            return y < 2000;
          });
        }
      }
      return filtered;
    };

    if (query.length > 0) {
      const searchParams = { query };
      if (year !== 'all' && /^\d{4}$/.test(year)) {
        searchParams.primary_release_year = year;
      }

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const tmdbStartPage = Math.floor(startIndex / 20) + 1;
      const tmdbEndPage = Math.floor((endIndex - 1) / 20) + 1;

      const pagesToFetch = tmdbStartPage === tmdbEndPage ? [tmdbStartPage] : [tmdbStartPage, tmdbEndPage];
      const results = await Promise.all(
        pagesToFetch.map(p =>
          fetchFromTMDB('/search/movie', { ...searchParams, page: p, include_adult: false }).catch(() => ({ results: [], total_results: 0 }))
        )
      );

      let totalResults = results[0]?.total_results || 0;
      let combined = [];
      results.forEach(r => {
        if (Array.isArray(r.results)) combined.push(...r.results);
      });

      if (genre !== 'all' || (year !== 'all' && !/^\d{4}$/.test(year))) {
        combined = applyInMemoryFilters(combined);
        totalResults = combined.length;
      }

      combined = filterAdultContent(combined);
      const sliceStart = startIndex - (tmdbStartPage - 1) * 20;
      const sliced = combined.slice(sliceStart, sliceStart + limit).map(enrichMovie);

      return res.status(200).json({
        success: true,
        page,
        limit,
        total_results: capTotalResults(totalResults, limit),
        total_pages: capTotalPages(totalResults, limit),
        results: page > capTotalPages(totalResults, limit) ? [] : sliced
      });
    }

    if (filter === 'campaigns' || sortBy === 'campaigns') {
      const featuredPromises = FEATURED_CAMPAIGN_IDS.map(mid =>
        fetchFromTMDB(`/movie/${mid}`).catch(() => null)
      );
      let featuredList = (await Promise.all(featuredPromises)).filter(Boolean).map(enrichMovie);
      featuredList = filterAdultContent(applyInMemoryFilters(featuredList));

      const totalResults = featuredList.length;
      const startIndex = (page - 1) * limit;
      const sliced = featuredList.slice(startIndex, startIndex + limit);

      return res.status(200).json({
        success: true,
        page,
        limit,
        total_results: capTotalResults(totalResults, limit),
        total_pages: capTotalPages(totalResults, limit),
        results: page > capTotalPages(totalResults, limit) ? [] : sliced
      });
    }

    const hasActiveFilters = (genre !== 'all') || (year !== 'all') || (sortBy !== 'popularity.desc');

    if (hasActiveFilters) {
      const discoverParams = {
        sort_by: sortBy === 'campaigns' ? 'popularity.desc' : sortBy,
        'vote_count.gte': 40
      };

      if (genre !== 'all' && !isNaN(Number(genre))) {
        discoverParams.with_genres = genre;
      }

      if (year !== 'all') {
        if (/^\d{4}$/.test(year)) {
          discoverParams.primary_release_year = year;
        } else if (year === '2015-2018') {
          discoverParams['primary_release_date.gte'] = '2015-01-01';
          discoverParams['primary_release_date.lte'] = '2018-12-31';
        } else if (year === '2010-2014') {
          discoverParams['primary_release_date.gte'] = '2010-01-01';
          discoverParams['primary_release_date.lte'] = '2014-12-31';
        } else if (year === '2000-2009') {
          discoverParams['primary_release_date.gte'] = '2000-01-01';
          discoverParams['primary_release_date.lte'] = '2009-12-31';
        } else if (year === 'pre-2000') {
          discoverParams['primary_release_date.lte'] = '1999-12-31';
        }
      }

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const tmdbStartPage = Math.floor(startIndex / 20) + 1;
      const tmdbEndPage = Math.floor((endIndex - 1) / 20) + 1;

      const pagesToFetch = tmdbStartPage === tmdbEndPage ? [tmdbStartPage] : [tmdbStartPage, tmdbEndPage];
      const results = await Promise.all(
        pagesToFetch.map(p =>
          fetchFromTMDB('/discover/movie', { ...discoverParams, page: p, include_adult: false }).catch(() => ({ results: [], total_results: 0 }))
        )
      );

      const totalResults = results[0]?.total_results || 0;
      let combined = [];
      results.forEach(r => {
        if (Array.isArray(r.results)) combined.push(...r.results);
      });
      combined = filterAdultContent(combined);

      const sliceStart = startIndex - (tmdbStartPage - 1) * 20;
      const sliced = combined.slice(sliceStart, sliceStart + limit).map(enrichMovie);

      return res.status(200).json({
        success: true,
        page,
        limit,
        total_results: capTotalResults(totalResults, limit),
        total_pages: capTotalPages(totalResults, limit),
        results: page > capTotalPages(totalResults, limit) ? [] : sliced
      });
    }

    const trendingData = await fetchFromTMDB('/trending/movie/week', { page: Math.min(page, MAX_TMDB_PAGES), include_adult: false }).catch(() => ({ results: [], total_results: 0 }));
    let list = filterAdultContent(trendingData.results || []).map(enrichMovie);

    if (page === 1) {
      const featuredPromises = FEATURED_CAMPAIGN_IDS.map(mid =>
        fetchFromTMDB(`/movie/${mid}`).catch(() => null)
      );
      const featuredMovies = filterAdultContent((await Promise.all(featuredPromises)).filter(Boolean)).map(enrichMovie);
      const featuredMap = new Map();
      featuredMovies.forEach(m => featuredMap.set(m.id, m));
      list.forEach(m => {
        if (!featuredMap.has(m.id)) featuredMap.set(m.id, m);
      });
      list = Array.from(featuredMap.values());
    }

    const totalResults = trendingData.total_results || 100;
    const sliced = list.slice(0, limit);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total_results: capTotalResults(totalResults, limit),
      total_pages: capTotalPages(totalResults, limit),
      results: page > capTotalPages(totalResults, limit) ? [] : sliced
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
