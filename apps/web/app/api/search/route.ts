/**
 * Smart Search API Route - Production-Grade E-Commerce Search
 *
 * Features:
 * - N-gram tokenization for partial matching
 * - Damerau-Levenshtein with dynamic threshold for typo tolerance
 * - Arabic/French/English multi-language normalization
 * - Synonym expansion (fashion domain + user intent)
 * - Category-aware boosting & tag/material/pattern matching
 * - Word-boundary prefix matching for autocomplete
 * - Score blending: exact > prefix > contains > fuzzy > tag > category
 * - Caching with TTL
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getCache, setCache } from '@/lib/cache';

// ============================================================================
// RETRY HELPER
// ============================================================================

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500,
): Promise<T> {
  let lastError: Error | unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('Connection terminated') ||
          error.message.includes('timeout') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('connection pool'));
      if (!isRetryable || attempt === maxRetries) throw error;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`[Search API] Retry ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ============================================================================
// ARABIC / FRENCH / ENGLISH NORMALIZATION
// ============================================================================

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, '')
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    .replace(/\u0640/g, '');
}

function normalizeFrench(text: string): string {
  return text
    .replace(/[\u00e9\u00e8\u00ea\u00eb]/g, 'e')
    .replace(/[\u00e0\u00e2\u00e4]/g, 'a')
    .replace(/[\u00f9\u00fb\u00fc]/g, 'u')
    .replace(/[\u00ef\u00ee]/g, 'i')
    .replace(/[\u00f4\u00f6]/g, 'o')
    .replace(/\u00e7/g, 'c')
    .replace(/\u0153/g, 'oe')
    .replace(/\u00e6/g, 'ae');
}

function normalize(text: string): string {
  let t = text.toLowerCase().trim();
  t = normalizeArabic(t);
  t = normalizeFrench(t);
  t = t.replace(/\s+/g, ' ');
  return t;
}

// ============================================================================
// SYNONYM DICTIONARY - fashion & kids domain
// ============================================================================

const SYNONYM_MAP: Record<string, string[]> = {
  dress: ['robe', '\u0641\u0633\u062a\u0627\u0646', 'gown', 'frock'],
  robe: ['dress', '\u0641\u0633\u062a\u0627\u0646', 'gown'],
  shirt: ['chemise', '\u0642\u0645\u064a\u0635', 'top', 'blouse'],
  pants: ['pantalon', '\u0628\u0646\u0637\u0644\u0648\u0646', 'trousers', 'jeans'],
  skirt: ['jupe', '\u062a\u0646\u0648\u0631\u0629'],
  jacket: ['veste', '\u062c\u0627\u0643\u064a\u062a', 'coat', 'blazer'],
  coat: ['manteau', '\u0645\u0639\u0637\u0641', 'jacket'],
  cotton: ['coton', '\u0642\u0637\u0646', '\u0642\u0637\u0646\u064a'],
  silk: ['soie', '\u062d\u0631\u064a\u0631', '\u062d\u0631\u064a\u0631\u064a'],
  linen: ['lin', '\u0643\u062a\u0627\u0646', '\u0643\u062a\u0627\u0646\u064a'],
  polyester: ['\u0628\u0648\u0644\u064a\u0633\u062a\u0631'],
  wool: ['laine', '\u0635\u0648\u0641'],
  pink: ['rose', '\u0648\u0631\u062f\u064a', '\u0632\u0647\u0631\u064a'],
  red: ['rouge', '\u0623\u062d\u0645\u0631', '\u0627\u062d\u0645\u0631'],
  blue: ['bleu', '\u0623\u0632\u0631\u0642', '\u0627\u0632\u0631\u0642'],
  white: ['blanc', '\u0623\u0628\u064a\u0636', '\u0627\u0628\u064a\u0636'],
  black: ['noir', '\u0623\u0633\u0648\u062f', '\u0627\u0633\u0648\u062f'],
  green: ['vert', '\u0623\u062e\u0636\u0631', '\u0627\u062e\u0636\u0631'],
  yellow: ['jaune', '\u0623\u0635\u0641\u0631', '\u0627\u0635\u0641\u0631'],
  purple: ['violet', '\u0628\u0646\u0641\u0633\u062c\u064a'],
  beige: ['\u0628\u064a\u062c'],
  brown: ['marron', 'brun', '\u0628\u0646\u064a'],
  floral: ['fleuri', '\u0632\u0647\u0631\u064a', '\u0648\u0631\u062f', '\u0648\u0631\u0648\u062f'],
  striped: ['raye', '\u0645\u062e\u0637\u0637', 'stripes'],
  solid: ['uni', '\u0633\u0627\u062f\u0629', 'plain'],
  plaid: ['carreaux', '\u0645\u0631\u0628\u0639\u0627\u062a', 'checked', 'checkered'],
  boy: ['garcon', '\u0648\u0644\u062f', '\u0627\u0648\u0644\u0627\u062f', 'boys'],
  girl: ['fille', '\u0628\u0646\u062a', '\u0628\u0646\u0627\u062a', 'girls'],
  baby: ['bebe', '\u0637\u0641\u0644', '\u0631\u0636\u064a\u0639', 'infant', 'toddler'],
  kids: ['enfants', '\u0623\u0637\u0641\u0627\u0644', '\u0627\u0637\u0641\u0627\u0644', 'children'],
  kitchen: ['cuisine', '\u0645\u0637\u0628\u062e'],
  apron: ['tablier', '\u0645\u0631\u064a\u0648\u0644', '\u0645\u0626\u0632\u0631'],
  towel: ['serviette', '\u0645\u0646\u0634\u0641\u0629', '\u0641\u0648\u0637\u0629'],
  birthday: ['anniversaire', '\u0639\u064a\u062f \u0645\u064a\u0644\u0627\u062f'],
  party: ['fete', '\u062d\u0641\u0644\u0629'],
  school: ['ecole', '\u0645\u062f\u0631\u0633\u0629'],
  summer: ['ete', '\u0635\u064a\u0641'],
  winter: ['hiver', '\u0634\u062a\u0627\u0621'],
  spring: ['printemps', '\u0631\u0628\u064a\u0639'],
};

function expandSynonyms(query: string): string[] {
  const normalized = normalize(query);
  const words = normalized.split(/\s+/);
  const expanded = new Set<string>([normalized]);

  for (const word of words) {
    for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
      const nKey = normalize(key);
      if (nKey === word || synonyms.some((s) => normalize(s) === word)) {
        expanded.add(nKey);
        for (const syn of synonyms) {
          expanded.add(normalize(syn));
        }
      }
    }
  }

  return Array.from(expanded);
}

// ============================================================================
// N-GRAM GENERATION
// ============================================================================

function generateNgrams(text: string, n: number = 3): Set<string> {
  const ngrams = new Set<string>();
  const t = normalize(text);
  if (t.length < n) {
    ngrams.add(t);
    return ngrams;
  }
  for (let i = 0; i <= t.length - n; i++) {
    ngrams.add(t.substring(i, i + n));
  }
  return ngrams;
}

function ngramSimilarity(a: string, b: string, n: number = 3): number {
  const ngramsA = generateNgrams(a, n);
  const ngramsB = generateNgrams(b, n);
  if (ngramsA.size === 0 || ngramsB.size === 0) return 0;
  let intersection = 0;
  for (const gram of ngramsA) {
    if (ngramsB.has(gram)) intersection++;
  }
  return (2 * intersection) / (ngramsA.size + ngramsB.size);
}

// ============================================================================
// DAMERAU-LEVENSHTEIN WITH DYNAMIC THRESHOLD
// ============================================================================

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i]![j] = Math.min(dp[i]![j]!, dp[i - 2]![j - 2]! + cost);
      }
    }
  }
  return dp[m]![n]!;
}

function fuzzyMatch(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (q === t) return 1;
  if (t.startsWith(q)) return 0.95;
  if (t.includes(q)) return 0.9;

  const maxLen = Math.max(q.length, t.length);
  if (maxLen === 0) return 0;

  const maxDist = q.length <= 3 ? 1 : q.length <= 6 ? 2 : 3;
  const dist = levenshteinDistance(q, t);
  if (dist <= maxDist) {
    return 1 - dist / maxLen;
  }
  return 0;
}

// ============================================================================
// MULTI-SIGNAL SCORING ENGINE
// ============================================================================

interface ScoringContext {
  query: string;
  queryNormalized: string;
  queryWords: string[];
  synonyms: string[];
}

function scoreText(text: string, ctx: ScoringContext, weight: number = 1): number {
  if (!text) return 0;
  const t = normalize(text);
  const q = ctx.queryNormalized;

  if (t === q) return 1.0 * weight;
  if (t.startsWith(q)) return 0.95 * weight;
  if (t.includes(q)) return 0.85 * weight;

  const tWords = t.split(/\s+/);
  let wordMatchCount = 0;
  let prefixMatchCount = 0;

  for (const qw of ctx.queryWords) {
    for (const tw of tWords) {
      if (tw === qw) { wordMatchCount++; break; }
      if (tw.startsWith(qw) || qw.startsWith(tw)) { prefixMatchCount++; break; }
    }
  }

  if (wordMatchCount === ctx.queryWords.length) return 0.9 * weight;
  if (wordMatchCount > 0) {
    return (0.7 + (wordMatchCount / ctx.queryWords.length) * 0.15) * weight;
  }
  if (prefixMatchCount > 0) {
    return (0.6 + (prefixMatchCount / ctx.queryWords.length) * 0.1) * weight;
  }

  for (const syn of ctx.synonyms) {
    if (t.includes(syn)) return 0.65 * weight;
    for (const tw of tWords) {
      if (tw === syn) return 0.6 * weight;
    }
  }

  const ngramScore = ngramSimilarity(q, t);
  if (ngramScore > 0.4) return ngramScore * 0.55 * weight;

  let bestFuzzy = 0;
  for (const qw of ctx.queryWords) {
    for (const tw of tWords) {
      const f = fuzzyMatch(qw, tw);
      if (f > bestFuzzy) bestFuzzy = f;
    }
  }
  if (bestFuzzy > 0) return bestFuzzy * 0.5 * weight;

  return 0;
}

// ============================================================================
// SEARCH RESULT INTERFACE
// ============================================================================

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  likeCount: number;
  salesCount: number;
  inStock: boolean;
  isFeatured: boolean;
  category: string;
  categorySlug: string;
  score: number;
  matchReasons: string[];
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q')?.trim() || '';
    const locale = searchParams.get('locale') || 'ar';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const autocomplete = searchParams.get('autocomplete') === 'true';

    if (!rawQuery || rawQuery.length < 1) {
      return NextResponse.json({
        success: true,
        results: [],
        suggestions: [],
        total: 0,
        query: '',
      });
    }

    const cacheKey = `search:v2:${rawQuery}:${locale}:${limit}:${autocomplete}`;
    const cached = getCache<object>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Cache': 'HIT',
        },
      });
    }

    const queryNormalized = normalize(rawQuery);
    const queryWords = queryNormalized.split(/\s+/).filter(Boolean);
    const synonyms = expandSynonyms(rawQuery);

    const ctx: ScoringContext = { query: rawQuery, queryNormalized, queryWords, synonyms };

    const products = await withRetry(() =>
      prisma.product.findMany({
        where: {
          status: 'PUBLISHED',
          isActive: true,
          deletedAt: null,
        },
        include: {
          translations: true,
          category: {
            include: { translations: true },
          },
          tags: {
            include: {
              tag: {
                include: { translations: true },
              },
            },
          },
          media: {
            where: { isThumb: true },
            include: { media: true },
            orderBy: { position: 'asc' },
            take: 1,
          },
          variants: {
            include: {
              size: true,
              color: { include: { translations: true } },
            },
          },
        },
      }),
    );

    const scoredResults: SearchResult[] = [];

    for (const product of products) {
      let totalScore = 0;
      const matchReasons: string[] = [];

      // Name matching (weight 1.0)
      let bestNameScore = 0;
      for (const trans of product.translations) {
        const s = scoreText(trans.name || '', ctx, 1.0);
        if (s > bestNameScore) bestNameScore = s;
      }
      if (bestNameScore > 0) { totalScore += bestNameScore; matchReasons.push('name'); }

      // Description matching (weight 0.5)
      let bestDescScore = 0;
      for (const trans of product.translations) {
        const s = scoreText(trans.description || '', ctx, 0.5);
        if (s > bestDescScore) bestDescScore = s;
      }
      if (bestDescScore > 0) { totalScore += bestDescScore; matchReasons.push('description'); }

      // Slug matching (weight 0.4)
      const slugScore = scoreText(product.slug, ctx, 0.4);
      if (slugScore > 0) { totalScore += slugScore; matchReasons.push('slug'); }

      // Category matching (weight 0.3)
      if (product.category) {
        let bestCatScore = 0;
        const catSlugScore = scoreText(product.category.slug, ctx, 0.3);
        if (catSlugScore > bestCatScore) bestCatScore = catSlugScore;
        for (const ct of product.category.translations) {
          const s = scoreText(ct.name || '', ctx, 0.3);
          if (s > bestCatScore) bestCatScore = s;
        }
        if (bestCatScore > 0) { totalScore += bestCatScore; matchReasons.push('category'); }
      }

      // Tag matching (material, pattern, occasion - weight 0.35)
      for (const pt of product.tags) {
        const tag = pt.tag;
        let bestTagScore = 0;
        const tagSlugScore = scoreText(tag.slug, ctx, 0.35);
        if (tagSlugScore > bestTagScore) bestTagScore = tagSlugScore;
        for (const tt of tag.translations) {
          const s = scoreText(tt.label || '', ctx, 0.35);
          if (s > bestTagScore) bestTagScore = s;
        }
        if (bestTagScore > 0) { totalScore += bestTagScore; matchReasons.push('tag:' + tag.type.toLowerCase()); }
      }

      // Color matching (weight 0.25)
      const seenColors = new Set<string>();
      for (const v of product.variants) {
        if (v.color && !seenColors.has(v.color.id)) {
          seenColors.add(v.color.id);
          let bestColorScore = 0;
          const codeScore = scoreText(v.color.code, ctx, 0.25);
          if (codeScore > bestColorScore) bestColorScore = codeScore;
          for (const ct of v.color.translations) {
            const s = scoreText(ct.label || '', ctx, 0.25);
            if (s > bestColorScore) bestColorScore = s;
          }
          if (bestColorScore > 0) { totalScore += bestColorScore; matchReasons.push('color'); }
        }
      }

      // Size matching (weight 0.15)
      const seenSizes = new Set<string>();
      for (const v of product.variants) {
        if (v.size && !seenSizes.has(v.size.id)) {
          seenSizes.add(v.size.id);
          const sizeScore = scoreText(v.size.code, ctx, 0.15);
          if (sizeScore > 0) { totalScore += sizeScore; matchReasons.push('size'); }
        }
      }

      // Popularity boost
      if (totalScore > 0) {
        if (product.isFeatured) totalScore *= 1.1;
        if (product.salesCount > 10) totalScore *= 1.05;
        if (product.avgRating >= 4) totalScore *= 1.03;
      }

      if (totalScore >= 0.2) {
        const preferredTrans =
          product.translations.find((t) => t.locale === locale.toUpperCase()) ||
          product.translations.find((t) => t.locale === 'EN') ||
          product.translations[0];

        const catTrans =
          product.category?.translations.find((t) => t.locale === locale.toUpperCase()) ||
          product.category?.translations.find((t) => t.locale === 'EN') ||
          product.category?.translations[0];

        scoredResults.push({
          id: product.id,
          slug: product.slug,
          name: preferredTrans?.name || product.slug,
          description: preferredTrans?.description || '',
          price: product.basePriceMinor / 100,
          originalPrice: null,
          currency: product.currency,
          imageUrl: product.media[0]?.media?.url || '',
          rating: product.avgRating,
          reviewCount: product.reviewCount,
          likeCount: product.likeCount,
          salesCount: product.salesCount,
          inStock: product.variants.some((v) => v.stock > 0),
          isFeatured: product.isFeatured,
          category: catTrans?.name || product.category?.slug || '',
          categorySlug: product.category?.slug || '',
          score: Math.round(totalScore * 1000) / 1000,
          matchReasons: [...new Set(matchReasons)],
        });
      }
    }

    scoredResults.sort((a, b) => b.score - a.score);
    const results = scoredResults.slice(0, limit);

    const suggestions: string[] = [];
    if (autocomplete) {
      const seen = new Set<string>();
      for (const r of results.slice(0, 5)) {
        const name = r.name.toLowerCase();
        if (!seen.has(name)) {
          suggestions.push(r.name);
          seen.add(name);
        }
      }
    }

    const responseData = {
      success: true,
      results,
      suggestions,
      total: scoredResults.length,
      query: rawQuery,
    };

    setCache(cacheKey, responseData, 60000);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed', results: [], total: 0 },
      { status: 500 },
    );
  }
}
