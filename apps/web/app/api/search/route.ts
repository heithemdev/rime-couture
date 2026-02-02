/**
 * Smart Search API Route
 * Fault-tolerant fuzzy search across products using Prisma
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getCache, setCache } from '@/lib/cache';

// ============================================================================
// FUZZY MATCHING UTILITIES
// ============================================================================

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1, // substitution
          matrix[i]![j - 1]! + 1, // insertion
          matrix[i - 1]![j]! + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length]![a.length]!;
}

function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي');
}

function calculateSimilarity(query: string, text: string): number {
  const normalizedQuery = normalizeArabic(query.toLowerCase().trim());
  const normalizedText = normalizeArabic(text.toLowerCase().trim());

  // Exact match
  if (normalizedText === normalizedQuery) return 1;

  // Contains match
  if (normalizedText.includes(normalizedQuery)) return 0.9;

  // Word-level matching
  const queryWords = normalizedQuery.split(/\s+/);
  const textWords = normalizedText.split(/\s+/);

  let matchedWords = 0;
  for (const qWord of queryWords) {
    for (const tWord of textWords) {
      if (tWord.includes(qWord) || qWord.includes(tWord)) {
        matchedWords++;
        break;
      }
    }
  }

  if (matchedWords > 0) {
    return 0.7 + (matchedWords / queryWords.length) * 0.2;
  }

  // Levenshtein distance for typo tolerance
  const maxLen = Math.max(normalizedQuery.length, normalizedText.length);
  if (maxLen === 0) return 0;

  const distance = levenshteinDistance(normalizedQuery, normalizedText);
  const similarity = 1 - distance / maxLen;

  return similarity > 0.5 ? similarity * 0.6 : 0;
}

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  category: string;
  categorySlug: string;
  score: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const locale = searchParams.get('locale') || 'ar';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        total: 0,
        query: '',
      });
    }

    // Check cache
    const cacheKey = `search:${query}:${locale}:${limit}`;
    const cached = getCache<object>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch products with translations using Prisma
    const products = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        isActive: true,
        deletedAt: null,
      },
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          },
        },
        media: {
          where: { isThumb: true },
          include: {
            media: true,
          },
          orderBy: { position: 'asc' },
          take: 1,
        },
      },
    });

    // Score and filter products
    const scoredResults: SearchResult[] = [];

    for (const product of products) {
      let maxScore = 0;
      let bestName = product.slug;
      let bestDescription = '';

      // Check all translations
      for (const trans of product.translations) {
        const nameScore = calculateSimilarity(query, trans.name || '');
        const descScore = calculateSimilarity(query, trans.description || '') * 0.7;
        const slugScore = calculateSimilarity(query, product.slug) * 0.5;

        const totalScore = Math.max(nameScore, descScore, slugScore);

        if (totalScore > maxScore) {
          maxScore = totalScore;
          if (trans.locale === locale || !bestName) {
            bestName = trans.name || product.slug;
            bestDescription = trans.description || '';
          }
        }
      }

      // Also check slug
      const slugScore = calculateSimilarity(query, product.slug) * 0.5;
      if (slugScore > maxScore) {
        maxScore = slugScore;
      }

      // Only include results with reasonable similarity
      if (maxScore >= 0.3) {
        // Get preferred translation
        const preferredTrans =
          product.translations.find((t) => t.locale === locale) ||
          product.translations.find((t) => t.locale === 'EN') ||
          product.translations[0];

        const catTrans =
          product.category?.translations.find((t) => t.locale === locale) ||
          product.category?.translations.find((t) => t.locale === 'EN') ||
          product.category?.translations[0];

        scoredResults.push({
          id: product.id,
          slug: product.slug,
          name: preferredTrans?.name || bestName,
          description: preferredTrans?.description || bestDescription,
          price: product.basePriceMinor,
          currency: product.currency,
          imageUrl: product.media[0]?.media?.url || '',
          rating: product.avgRating,
          reviewCount: product.reviewCount,
          category: catTrans?.name || product.category?.slug || '',
          categorySlug: product.category?.slug || '',
          score: maxScore,
        });
      }
    }

    // Sort by score and limit
    scoredResults.sort((a, b) => b.score - a.score);
    const results = scoredResults.slice(0, limit);

    const responseData = {
      success: true,
      results,
      total: scoredResults.length,
      query,
    };

    // Cache the response
    setCache(cacheKey, responseData);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Search API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        results: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
