// src/utils/searchStorage.ts
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const USE_DATABASE = 
  process.env.NEXT_PUBLIC_USE_DATABASE === 'true' ||
  process.env.VERCEL_ENV === 'production' ||
  process.env.NODE_ENV === 'production';

// ============ DATABASE STORAGE ============
class DatabaseSearchStorage {
  // Search Index
  async indexContent(data: {
    entityType: string;
    entityId: number;
    title: string;
    content: string;
    metadata?: any;
  }) {
    return await db.indexContent(data);
  }

  async searchContent(searchTerm: string, entityTypes?: string[], limit: number = 20) {
    return await db.searchContent(searchTerm, entityTypes, limit);
  }

  async removeFromIndex(entityType: string, entityId: number) {
    return await db.removeFromIndex(entityType, entityId);
  }

  async reindexAll() {
    return await db.reindexAll();
  }

  // Search History
  async saveSearchQuery(userId: number, query: string, resultCount: number) {
    return await db.saveSearchQuery(userId, query, resultCount);
  }

  async getUserSearchHistory(userId: number, limit: number = 20) {
    return await db.getUserSearchHistory(userId, limit);
  }

  async clearSearchHistory(userId: number) {
    return await db.clearSearchHistory(userId);
  }

  async getPopularSearches(limit: number = 10) {
    return await db.getPopularSearches(limit);
  }

  // Search Suggestions
  async createSearchSuggestion(data: { suggestion: string; category?: string; priority?: number }) {
    return await db.createSearchSuggestion(data);
  }

  async getSearchSuggestions(prefix: string, limit: number = 10) {
    return await db.getSearchSuggestions(prefix, limit);
  }

  async deleteSearchSuggestion(id: number) {
    return await db.deleteSearchSuggestion(id);
  }

  // Trending Content
  async trackView(data: { entityType: string; entityId: number; userId?: number }) {
    return await db.trackView(data);
  }

  async getTrendingContent(entityType?: string, limit: number = 20, timeWindow: number = 7) {
    return await db.getTrendingContent(entityType, limit, timeWindow);
  }

  async resetTrendingCounts() {
    return await db.resetTrendingCounts();
  }

  // Saved Searches
  async saveSearch(userId: number, name: string, query: string, filters?: any) {
    return await db.saveSearch(userId, name, query, filters);
  }

  async getSavedSearches(userId: number) {
    return await db.getSavedSearches(userId);
  }

  async deleteSavedSearch(id: number, userId: number) {
    return await db.deleteSavedSearch(id, userId);
  }

  // Recommendations
  async createRecommendation(data: {
    userId: number;
    entityType: string;
    entityId: number;
    score: number;
    reason?: string;
  }) {
    return await db.createRecommendation(data);
  }

  async getUserRecommendations(userId: number, entityType?: string, limit: number = 10) {
    return await db.getUserRecommendations(userId, entityType, limit);
  }

  async deleteRecommendation(id: number, userId: number) {
    return await db.deleteRecommendation(id, userId);
  }

  async clearUserRecommendations(userId: number) {
    return await db.clearUserRecommendations(userId);
  }

  // Recently Viewed
  async addToRecentlyViewed(userId: number, entityType: string, entityId: number) {
    return await db.addToRecentlyViewed(userId, entityType, entityId);
  }

  async getRecentlyViewed(userId: number, entityType?: string, limit: number = 20) {
    return await db.getRecentlyViewed(userId, entityType, limit);
  }

  async clearRecentlyViewed(userId: number) {
    return await db.clearRecentlyViewed(userId);
  }

  // Search Filters
  async getAvailableFilters(entityType: string) {
    return await db.getAvailableFilters(entityType);
  }

  // Search Analytics
  async trackSearchAnalytics(data: {
    userId?: number;
    query: string;
    resultCount: number;
    clickedResults: number[];
    searchDuration: number;
  }) {
    return await db.trackSearchAnalytics(data);
  }

  async getSearchAnalytics(limit: number = 100, offset: number = 0) {
    return await db.getSearchAnalytics(limit, offset);
  }

  async getFailedSearches(limit: number = 50) {
    return await db.getFailedSearches(limit);
  }
}

// ============ FILE STORAGE ============
class FileSearchStorage {
  private dataDir = path.join(process.cwd(), 'public', 'data');
  private searchIndexFile = path.join(this.dataDir, 'search_index.json');
  private searchHistoryFile = path.join(this.dataDir, 'search_history.json');
  private suggestionsFile = path.join(this.dataDir, 'search_suggestions.json');
  private trendingFile = path.join(this.dataDir, 'trending_content.json');
  private savedSearchesFile = path.join(this.dataDir, 'saved_searches.json');
  private recommendationsFile = path.join(this.dataDir, 'recommendations.json');
  private recentlyViewedFile = path.join(this.dataDir, 'recently_viewed.json');
  private analyticsFile = path.join(this.dataDir, 'search_analytics.json');

  private ensureFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(filePath, '[]');
    }
  }

  private readJSON(filePath: string): any[] {
    this.ensureFile(filePath);
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  private writeJSON(filePath: string, data: any[]) {
    this.ensureFile(filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  // Search Index
  async indexContent(data: {
    entityType: string;
    entityId: number;
    title: string;
    content: string;
    metadata?: any;
  }) {
    const index = this.readJSON(this.searchIndexFile);
    const existing = index.findIndex(
      (item: any) => item.entity_type === data.entityType && item.entity_id === data.entityId
    );

    const entry = {
      id: existing >= 0 ? index[existing].id : (index.length > 0 ? Math.max(...index.map((i: any) => i.id)) + 1 : 1),
      entity_type: data.entityType,
      entity_id: data.entityId,
      title: data.title,
      content: data.content,
      metadata: data.metadata || {},
      indexed_at: new Date().toISOString()
    };

    if (existing >= 0) {
      index[existing] = entry;
    } else {
      index.push(entry);
    }

    this.writeJSON(this.searchIndexFile, index);
    return entry;
  }

  async searchContent(searchTerm: string, entityTypes?: string[], limit: number = 20) {
    const index = this.readJSON(this.searchIndexFile);
    const term = searchTerm.toLowerCase();

    let filtered = index.filter((item: any) => {
      const matchesType = !entityTypes || entityTypes.includes(item.entity_type);
      const matchesSearch = 
        item.title.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term);
      return matchesType && matchesSearch;
    });

    // Simple ranking: prioritize title matches
    filtered = filtered.map((item: any) => ({
      ...item,
      rank: item.title.toLowerCase().includes(term) ? 2 : 1
    }));

    filtered.sort((a: any, b: any) => b.rank - a.rank);

    return filtered.slice(0, limit);
  }

  async removeFromIndex(entityType: string, entityId: number) {
    let index = this.readJSON(this.searchIndexFile);
    index = index.filter((item: any) => 
      !(item.entity_type === entityType && item.entity_id === entityId)
    );
    this.writeJSON(this.searchIndexFile, index);
  }

  async reindexAll() {
    this.writeJSON(this.searchIndexFile, []);
    return { message: 'Reindex initiated' };
  }

  // Search History
  async saveSearchQuery(userId: number, query: string, resultCount: number) {
    const history = this.readJSON(this.searchHistoryFile);
    const entry = {
      id: history.length > 0 ? Math.max(...history.map((h: any) => h.id)) + 1 : 1,
      user_id: userId,
      query,
      result_count: resultCount,
      searched_at: new Date().toISOString()
    };
    history.push(entry);
    this.writeJSON(this.searchHistoryFile, history);
    return entry;
  }

  async getUserSearchHistory(userId: number, limit: number = 20) {
    const history = this.readJSON(this.searchHistoryFile);
    return history
      .filter((h: any) => h.user_id === userId)
      .sort((a: any, b: any) => new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime())
      .slice(0, limit);
  }

  async clearSearchHistory(userId: number) {
    let history = this.readJSON(this.searchHistoryFile);
    history = history.filter((h: any) => h.user_id !== userId);
    this.writeJSON(this.searchHistoryFile, history);
  }

  async getPopularSearches(limit: number = 10) {
    const history = this.readJSON(this.searchHistoryFile);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const recent = history.filter((h: any) => new Date(h.searched_at) > cutoff);
    const counts: any = {};

    recent.forEach((h: any) => {
      if (!counts[h.query]) {
        counts[h.query] = { query: h.query, search_count: 0, last_searched: h.searched_at };
      }
      counts[h.query].search_count++;
      if (new Date(h.searched_at) > new Date(counts[h.query].last_searched)) {
        counts[h.query].last_searched = h.searched_at;
      }
    });

    return Object.values(counts)
      .sort((a: any, b: any) => b.search_count - a.search_count)
      .slice(0, limit);
  }

  // Search Suggestions
  async createSearchSuggestion(data: { suggestion: string; category?: string; priority?: number }) {
    const suggestions = this.readJSON(this.suggestionsFile);
    const entry = {
      id: suggestions.length > 0 ? Math.max(...suggestions.map((s: any) => s.id)) + 1 : 1,
      suggestion: data.suggestion,
      category: data.category || null,
      priority: data.priority || 0,
      created_at: new Date().toISOString()
    };
    suggestions.push(entry);
    this.writeJSON(this.suggestionsFile, suggestions);
    return entry;
  }

  async getSearchSuggestions(prefix: string, limit: number = 10) {
    const suggestions = this.readJSON(this.suggestionsFile);
    return suggestions
      .filter((s: any) => s.suggestion.toLowerCase().startsWith(prefix.toLowerCase()))
      .sort((a: any, b: any) => b.priority - a.priority || a.suggestion.localeCompare(b.suggestion))
      .slice(0, limit);
  }

  async deleteSearchSuggestion(id: number) {
    let suggestions = this.readJSON(this.suggestionsFile);
    suggestions = suggestions.filter((s: any) => s.id !== id);
    this.writeJSON(this.suggestionsFile, suggestions);
  }

  // Trending Content
  async trackView(data: { entityType: string; entityId: number; userId?: number }) {
    const trending = this.readJSON(this.trendingFile);
    const existing = trending.findIndex(
      (t: any) => t.entity_type === data.entityType && t.entity_id === data.entityId
    );

    if (existing >= 0) {
      trending[existing].view_count++;
      trending[existing].last_viewed = new Date().toISOString();
    } else {
      trending.push({
        id: trending.length > 0 ? Math.max(...trending.map((t: any) => t.id)) + 1 : 1,
        entity_type: data.entityType,
        entity_id: data.entityId,
        view_count: 1,
        last_viewed: new Date().toISOString()
      });
    }

    this.writeJSON(this.trendingFile, trending);
    return trending[existing >= 0 ? existing : trending.length - 1];
  }

  async getTrendingContent(entityType?: string, limit: number = 20, timeWindow: number = 7) {
    const trending = this.readJSON(this.trendingFile);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeWindow);

    let filtered = trending.filter((t: any) => {
      const matchesType = !entityType || t.entity_type === entityType;
      const matchesTime = new Date(t.last_viewed) > cutoff;
      return matchesType && matchesTime;
    });

    filtered.sort((a: any, b: any) => b.view_count - a.view_count);
    return filtered.slice(0, limit);
  }

  async resetTrendingCounts() {
    const trending = this.readJSON(this.trendingFile);
    trending.forEach((t: any) => t.view_count = 0);
    this.writeJSON(this.trendingFile, trending);
  }

  // Saved Searches
  async saveSearch(userId: number, name: string, query: string, filters?: any) {
    const saved = this.readJSON(this.savedSearchesFile);
    const entry = {
      id: saved.length > 0 ? Math.max(...saved.map((s: any) => s.id)) + 1 : 1,
      user_id: userId,
      name,
      query,
      filters: filters || {},
      created_at: new Date().toISOString()
    };
    saved.push(entry);
    this.writeJSON(this.savedSearchesFile, saved);
    return entry;
  }

  async getSavedSearches(userId: number) {
    const saved = this.readJSON(this.savedSearchesFile);
    return saved
      .filter((s: any) => s.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async deleteSavedSearch(id: number, userId: number) {
    let saved = this.readJSON(this.savedSearchesFile);
    saved = saved.filter((s: any) => !(s.id === id && s.user_id === userId));
    this.writeJSON(this.savedSearchesFile, saved);
  }

  // Recommendations
  async createRecommendation(data: {
    userId: number;
    entityType: string;
    entityId: number;
    score: number;
    reason?: string;
  }) {
    const recommendations = this.readJSON(this.recommendationsFile);
    const existing = recommendations.findIndex(
      (r: any) => r.user_id === data.userId && 
                  r.entity_type === data.entityType && 
                  r.entity_id === data.entityId
    );

    const entry = {
      id: existing >= 0 ? recommendations[existing].id : (recommendations.length > 0 ? Math.max(...recommendations.map((r: any) => r.id)) + 1 : 1),
      user_id: data.userId,
      entity_type: data.entityType,
      entity_id: data.entityId,
      score: data.score,
      reason: data.reason || null,
      created_at: new Date().toISOString()
    };

    if (existing >= 0) {
      recommendations[existing] = entry;
    } else {
      recommendations.push(entry);
    }

    this.writeJSON(this.recommendationsFile, recommendations);
    return entry;
  }

  async getUserRecommendations(userId: number, entityType?: string, limit: number = 10) {
    const recommendations = this.readJSON(this.recommendationsFile);
    let filtered = recommendations.filter((r: any) => {
      const matchesUser = r.user_id === userId;
      const matchesType = !entityType || r.entity_type === entityType;
      return matchesUser && matchesType;
    });

    filtered.sort((a: any, b: any) => b.score - a.score);
    return filtered.slice(0, limit);
  }

  async deleteRecommendation(id: number, userId: number) {
    let recommendations = this.readJSON(this.recommendationsFile);
    recommendations = recommendations.filter((r: any) => !(r.id === id && r.user_id === userId));
    this.writeJSON(this.recommendationsFile, recommendations);
  }

  async clearUserRecommendations(userId: number) {
    let recommendations = this.readJSON(this.recommendationsFile);
    recommendations = recommendations.filter((r: any) => r.user_id !== userId);
    this.writeJSON(this.recommendationsFile, recommendations);
  }

  // Recently Viewed
  async addToRecentlyViewed(userId: number, entityType: string, entityId: number) {
    const recentlyViewed = this.readJSON(this.recentlyViewedFile);
    const existing = recentlyViewed.findIndex(
      (rv: any) => rv.user_id === userId && 
                   rv.entity_type === entityType && 
                   rv.entity_id === entityId
    );

    if (existing >= 0) {
      recentlyViewed[existing].viewed_at = new Date().toISOString();
    } else {
      recentlyViewed.push({
        id: recentlyViewed.length > 0 ? Math.max(...recentlyViewed.map((rv: any) => rv.id)) + 1 : 1,
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        viewed_at: new Date().toISOString()
      });
    }

    this.writeJSON(this.recentlyViewedFile, recentlyViewed);
    return recentlyViewed[existing >= 0 ? existing : recentlyViewed.length - 1];
  }

  async getRecentlyViewed(userId: number, entityType?: string, limit: number = 20) {
    const recentlyViewed = this.readJSON(this.recentlyViewedFile);
    let filtered = recentlyViewed.filter((rv: any) => {
      const matchesUser = rv.user_id === userId;
      const matchesType = !entityType || rv.entity_type === entityType;
      return matchesUser && matchesType;
    });

    filtered.sort((a: any, b: any) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime());
    return filtered.slice(0, limit);
  }

  async clearRecentlyViewed(userId: number) {
    let recentlyViewed = this.readJSON(this.recentlyViewedFile);
    recentlyViewed = recentlyViewed.filter((rv: any) => rv.user_id !== userId);
    this.writeJSON(this.recentlyViewedFile, recentlyViewed);
  }

  // Search Filters
  async getAvailableFilters(entityType: string) {
    const filters: any = {
      product: {
        price: { type: 'range', min: 0, max: 10000 },
        category: { type: 'select', options: [] },
        tags: { type: 'multiselect', options: [] },
        rating: { type: 'range', min: 0, max: 5 }
      },
      user: {
        tier: { type: 'select', options: ['Initiate', 'Seeker', 'Knight', 'Lord', 'Master'] },
        reputation: { type: 'range', min: 0, max: 10000 }
      },
      post: {
        created_at: { type: 'daterange' },
        category: { type: 'select', options: [] }
      }
    };

    return filters[entityType] || {};
  }

  // Search Analytics
  async trackSearchAnalytics(data: {
    userId?: number;
    query: string;
    resultCount: number;
    clickedResults: number[];
    searchDuration: number;
  }) {
    const analytics = this.readJSON(this.analyticsFile);
    const entry = {
      id: analytics.length > 0 ? Math.max(...analytics.map((a: any) => a.id)) + 1 : 1,
      user_id: data.userId || null,
      query: data.query,
      result_count: data.resultCount,
      clicked_results: data.clickedResults,
      search_duration: data.searchDuration,
      searched_at: new Date().toISOString()
    };
    analytics.push(entry);
    this.writeJSON(this.analyticsFile, analytics);
    return entry;
  }

  async getSearchAnalytics(limit: number = 100, offset: number = 0) {
    const analytics = this.readJSON(this.analyticsFile);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const recent = analytics.filter((a: any) => new Date(a.searched_at) > cutoff);
    const grouped: any = {};

    recent.forEach((a: any) => {
      if (!grouped[a.query]) {
        grouped[a.query] = {
          query: a.query,
          search_count: 0,
          total_results: 0,
          total_duration: 0,
          last_searched: a.searched_at
        };
      }
      grouped[a.query].search_count++;
      grouped[a.query].total_results += a.result_count;
      grouped[a.query].total_duration += a.search_duration;
      if (new Date(a.searched_at) > new Date(grouped[a.query].last_searched)) {
        grouped[a.query].last_searched = a.searched_at;
      }
    });

    const results = Object.values(grouped).map((g: any) => ({
      query: g.query,
      search_count: g.search_count,
      avg_results: g.total_results / g.search_count,
      avg_duration: g.total_duration / g.search_count,
      last_searched: g.last_searched
    }));

    results.sort((a: any, b: any) => b.search_count - a.search_count);
    return results.slice(offset, offset + limit);
  }

  async getFailedSearches(limit: number = 50) {
    const analytics = this.readJSON(this.analyticsFile);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const recent = analytics.filter((a: any) => 
      a.result_count === 0 && new Date(a.searched_at) > cutoff
    );

    const grouped: any = {};
    recent.forEach((a: any) => {
      if (!grouped[a.query]) {
        grouped[a.query] = { query: a.query, fail_count: 0, last_searched: a.searched_at };
      }
      grouped[a.query].fail_count++;
      if (new Date(a.searched_at) > new Date(grouped[a.query].last_searched)) {
        grouped[a.query].last_searched = a.searched_at;
      }
    });

    const results = Object.values(grouped);
    results.sort((a: any, b: any) => b.fail_count - a.fail_count);
    return results.slice(0, limit);
  }
}

// Export unified interface
export const searchStorage = USE_DATABASE 
  ? new DatabaseSearchStorage()
  : new FileSearchStorage();
