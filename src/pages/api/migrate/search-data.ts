// src/pages/api/migrate/search-data.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';

interface FileSearchIndex {
  id: number;
  entity_type: string;
  entity_id: number;
  title: string;
  content: string;
  metadata: any;
  indexed_at: string;
}

interface FileSearchHistory {
  id: number;
  user_id: number;
  query: string;
  result_count: number;
  searched_at: string;
}

interface FileSearchSuggestion {
  id: number;
  suggestion: string;
  category: string | null;
  priority: number;
  created_at: string;
}

interface FileTrendingContent {
  id: number;
  entity_type: string;
  entity_id: number;
  view_count: number;
  last_viewed: string;
}

interface FileSavedSearch {
  id: number;
  user_id: number;
  name: string;
  query: string;
  filters: any;
  created_at: string;
}

interface FileRecommendation {
  id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  score: number;
  reason: string | null;
  created_at: string;
}

interface FileRecentlyViewed {
  id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  viewed_at: string;
}

interface FileSearchAnalytics {
  id: number;
  user_id: number | null;
  query: string;
  result_count: number;
  clicked_results: number[];
  search_duration: number;
  searched_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only Master tier can migrate data
    if (session.tier !== 'Master') {
      return res.status(403).json({ error: 'Only Master tier users can migrate data' });
    }

    const dataDir = path.join(process.cwd(), 'public', 'data');
    
    // File paths
    const searchIndexFile = path.join(dataDir, 'search_index.json');
    const searchHistoryFile = path.join(dataDir, 'search_history.json');
    const suggestionsFile = path.join(dataDir, 'search_suggestions.json');
    const trendingFile = path.join(dataDir, 'trending_content.json');
    const savedSearchesFile = path.join(dataDir, 'saved_searches.json');
    const recommendationsFile = path.join(dataDir, 'recommendations.json');
    const recentlyViewedFile = path.join(dataDir, 'recently_viewed.json');
    const analyticsFile = path.join(dataDir, 'search_analytics.json');

    const stats = {
      searchIndex: 0,
      searchHistory: 0,
      suggestions: 0,
      trending: 0,
      savedSearches: 0,
      recommendations: 0,
      recentlyViewed: 0,
      analytics: 0,
      errors: [] as string[]
    };

    // 1. Migrate Search Index
    console.log('Migrating search index...');
    if (fs.existsSync(searchIndexFile)) {
      try {
        const searchIndex: FileSearchIndex[] = JSON.parse(
          fs.readFileSync(searchIndexFile, 'utf-8')
        );

        for (const item of searchIndex) {
          try {
            await sql`
              INSERT INTO search_index (
                entity_type, entity_id, title, content, metadata, indexed_at
              ) VALUES (
                ${item.entity_type}, ${item.entity_id}, ${item.title}, ${item.content},
                ${JSON.stringify(item.metadata)}, ${item.indexed_at}
              )
              ON CONFLICT (entity_type, entity_id) DO UPDATE SET
                title = ${item.title},
                content = ${item.content},
                metadata = ${JSON.stringify(item.metadata)},
                indexed_at = ${item.indexed_at}
            `;
            stats.searchIndex++;
          } catch (error: any) {
            stats.errors.push(`Search index ${item.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Search index file: ${error.message}`);
      }
    }

    // 2. Migrate Search History
    console.log('Migrating search history...');
    if (fs.existsSync(searchHistoryFile)) {
      try {
        const searchHistory: FileSearchHistory[] = JSON.parse(
          fs.readFileSync(searchHistoryFile, 'utf-8')
        );

        for (const item of searchHistory) {
          try {
            await sql`
              INSERT INTO search_history (
                user_id, query, result_count, searched_at
              ) VALUES (
                ${item.user_id}, ${item.query}, ${item.result_count}, ${item.searched_at}
              )
              ON CONFLICT DO NOTHING
            `;
            stats.searchHistory++;
          } catch (error: any) {
            stats.errors.push(`Search history ${item.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Search history file: ${error.message}`);
      }
    }

    // 3. Migrate Search Suggestions
    console.log('Migrating search suggestions...');
    if (fs.existsSync(suggestionsFile)) {
      try {
        const suggestions: FileSearchSuggestion[] = JSON.parse(
          fs.readFileSync(suggestionsFile, 'utf-8')
        );

        for (const item of suggestions) {
          try {
            await sql`
              INSERT INTO search_suggestions (
                suggestion, category, priority, created_at
              ) VALUES (
                ${item.suggestion}, ${item.category}, ${item.priority}, ${item.created_at}
              )
              ON CONFLICT DO NOTHING
            `;
            stats.suggestions++;
          } catch (error: any) {
            stats.errors.push(`Suggestion ${item.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Suggestions file: ${error.message}`);
      }
    }

    // 4. Migrate Trending Content
    console.log('Migrating trending content...');
    if (fs.existsSync(trendingFile)) {
      try {
        const trending: FileTrendingContent[] = JSON.parse(
          fs.readFileSync(trendingFile, 'utf-8')
        );

        for (const item of trending) {
          try {
            await sql`
              INSERT INTO trending_content (
                entity_type, entity_id, view_count, last_viewed
              ) VALUES (
                ${item.entity_type}, ${item.entity_id}, ${item.view_count}, ${item.last_viewed}
              )
              ON CONFLICT (entity_type, entity_id) DO UPDATE SET
                view_count = ${item.view_count},
                last_viewed = ${item.last_viewed}
            `;
            stats.trending++;
          } catch (error: any) {
            stats.errors.push(`Trending ${item.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Trending file: ${error.message}`);
      }
    }

    // 5. Migrate Saved Searches
    console.log('Migrating saved searches...');
    if (fs.existsSync(savedSearchesFile)) {
      try {
        const savedSearches: FileSavedSearch[] = JSON.parse(
          fs.readFileSync(savedSearchesFile, 'utf-8')
        );

        for (const item of savedSearches) {
          try {
            await sql`
              INSERT INTO saved_searches (
                user_id, name, query, filters, created_at
              ) VALUES (
                ${item.user_id}, ${item.name}, ${item.query}, 
                ${JSON.stringify(item.filters)}, ${item.created_at}
              )
              ON CONFLICT DO NOTHING
            `;
            stats.savedSearches++;
          } catch (error: any) {
            stats.errors.push(`Saved search ${item.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Saved searches file: ${error.message}`);
      }
    }

    // 6. Migrate Recommendations
    console.log('Migrating recommendations...');
    if (fs.existsSync(recommendationsFile)) {
      try {
        const recommendations: FileRecommendation[] = JSON.parse(
          fs.readFileSync(recommendationsFile, 'utf-8')
        );

        for (const item of recommendations) {
          try {
            await sql`
              INSERT INTO recommendations (
                user_id, entity_type, entity_id, score, reason, created_at
              ) VALUES (
                ${item.user_id}, ${item.entity_type}, ${item.entity_id},
                ${item.score}, ${item.reason}, ${item.created_at}
              )
              ON CONFLICT (user_id, entity_type, entity_id) DO UPDATE SET
                score = ${item.score},
                reason = ${item.reason},
                created_at = ${item.created_at}
            `;
            stats.recommendations++;
          } catch (error: any) {
            stats.errors.push(`Recommendation ${item.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Recommendations file: ${error.message}`);
      }
    }

    // 7. Migrate Recently Viewed
    console.log('Migrating recently viewed...');
    if (fs.existsSync(recentlyViewedFile)) {
      try {
        const recentlyViewed: FileRecentlyViewed[] = JSON.parse(
          fs.readFileSync(recentlyViewedFile, 'utf-8')
        );

        for (const item of recentlyViewed) {
          try {
            await sql`
              INSERT INTO recently_viewed (
                user_id, entity_type, entity_id, viewed_at
              ) VALUES (
                ${item.user_id}, ${item.entity_type}, ${item.entity_id}, ${item.viewed_at}
              )
              ON CONFLICT (user_id, entity_type, entity_id) DO UPDATE SET
                viewed_at = ${item.viewed_at}
            `;
            stats.recentlyViewed++;
          } catch (error: any) {
            stats.errors.push(`Recently viewed ${item.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Recently viewed file: ${error.message}`);
      }
    }

    // 8. Migrate Search Analytics
    console.log('Migrating search analytics...');
    if (fs.existsSync(analyticsFile)) {
      try {
        const analytics: FileSearchAnalytics[] = JSON.parse(
          fs.readFileSync(analyticsFile, 'utf-8')
        );

        for (const item of analytics) {
          try {
            await sql`
              INSERT INTO search_analytics (
                user_id, query, result_count, clicked_results, search_duration, searched_at
              ) VALUES (
                ${item.user_id}, ${item.query}, ${item.result_count},
                ${JSON.stringify(item.clicked_results)}, ${item.search_duration}, ${item.searched_at}
              )
              ON CONFLICT DO NOTHING
            `;
            stats.analytics++;
          } catch (error: any) {
            stats.errors.push(`Analytics ${item.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Analytics file: ${error.message}`);
      }
    }

    console.log('Search data migration completed:', stats);

    return res.status(200).json({
      message: 'Search data migration completed',
      stats: {
        searchIndex: stats.searchIndex,
        searchHistory: stats.searchHistory,
        suggestions: stats.suggestions,
        trending: stats.trending,
        savedSearches: stats.savedSearches,
        recommendations: stats.recommendations,
        recentlyViewed: stats.recentlyViewed,
        analytics: stats.analytics,
        totalErrors: stats.errors.length
      },
      errors: stats.errors.slice(0, 10),
      hasMoreErrors: stats.errors.length > 10
    });
  } catch (error: any) {
    console.error('Search migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}
