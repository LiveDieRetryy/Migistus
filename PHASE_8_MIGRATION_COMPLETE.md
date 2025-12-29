# Phase 8: Search & Discovery - Migration Complete

## Overview
Phase 8 implements a comprehensive search and discovery system with full-text search, trending content, personalized recommendations, search history, and advanced filtering capabilities.

## Database Schema

### 1. search_index
Full-text search index for all searchable content across the platform.

```sql
CREATE TABLE search_index (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(content, '')), 'B')
  ) STORED,
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_search_index_entity ON search_index(entity_type, entity_id);
CREATE INDEX idx_search_vector ON search_index USING GIN(search_vector);
CREATE INDEX idx_search_entity_type ON search_index(entity_type);
```

### 2. search_history
User search history for personalization and analytics.

```sql
CREATE TABLE search_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  query VARCHAR(255) NOT NULL,
  result_count INTEGER DEFAULT 0,
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_search_history_query ON search_history(query);
CREATE INDEX idx_search_history_searched_at ON search_history(searched_at DESC);
```

### 3. search_suggestions
Pre-configured search suggestions for autocomplete.

```sql
CREATE TABLE search_suggestions (
  id SERIAL PRIMARY KEY,
  suggestion VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_suggestions_suggestion ON search_suggestions(suggestion);
CREATE INDEX idx_search_suggestions_priority ON search_suggestions(priority DESC);
```

### 4. trending_content
Tracks view counts to determine trending items.

```sql
CREATE TABLE trending_content (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  view_count INTEGER DEFAULT 1,
  last_viewed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_trending_entity ON trending_content(entity_type, entity_id);
CREATE INDEX idx_trending_views ON trending_content(view_count DESC);
CREATE INDEX idx_trending_last_viewed ON trending_content(last_viewed DESC);
```

### 5. saved_searches
User-saved search queries with filters.

```sql
CREATE TABLE saved_searches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  query VARCHAR(255) NOT NULL,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);
```

### 6. recommendations
Personalized content recommendations for users.

```sql
CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id);
CREATE INDEX idx_recommendations_score ON recommendations(score DESC);
CREATE INDEX idx_recommendations_entity ON recommendations(entity_type, entity_id);
```

### 7. recently_viewed
Tracks user's recently viewed content.

```sql
CREATE TABLE recently_viewed (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_recently_viewed_user ON recently_viewed(user_id);
CREATE INDEX idx_recently_viewed_viewed_at ON recently_viewed(viewed_at DESC);
```

### 8. search_analytics
Detailed analytics for search performance and optimization.

```sql
CREATE TABLE search_analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  query VARCHAR(255) NOT NULL,
  result_count INTEGER NOT NULL,
  clicked_results JSONB DEFAULT '[]',
  search_duration INTEGER NOT NULL,
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_analytics_query ON search_analytics(query);
CREATE INDEX idx_search_analytics_searched_at ON search_analytics(searched_at DESC);
```

## API Endpoints

### Search

#### GET /api/search
Global search across all content types.

**Query Parameters:**
- `q` (required): Search query string
- `type` (optional): Entity type filter (product, user, post, message)
- `limit` (optional): Number of results (1-100, default: 20)

**Response:**
```json
{
  "query": "gaming chair",
  "results": [
    {
      "id": 1,
      "entity_type": "product",
      "entity_id": 42,
      "title": "Premium Gaming Chair",
      "content": "Ergonomic gaming chair with lumbar support...",
      "metadata": { "price": 299, "category": "furniture" },
      "rank": 1.5,
      "indexed_at": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 15,
  "duration": 45
}
```

#### GET /api/search/suggestions
Autocomplete suggestions.

**Query Parameters:**
- `prefix` (required): Search prefix
- `limit` (optional): Number of suggestions (1-50, default: 10)

**Response:**
```json
{
  "suggestions": [
    {
      "id": 1,
      "suggestion": "gaming chair",
      "category": "products",
      "priority": 10
    }
  ]
}
```

#### GET /api/search/trending
Get trending content.

**Query Parameters:**
- `type` (optional): Entity type filter
- `limit` (optional): Number of items (1-100, default: 20)
- `timeWindow` (optional): Days to look back (1-30, default: 7)

**Response:**
```json
{
  "trending": [
    {
      "id": 1,
      "entity_type": "product",
      "entity_id": 42,
      "view_count": 1523,
      "last_viewed": "2024-01-15T14:30:00Z"
    }
  ],
  "timeWindow": 7
}
```

#### GET /api/search/popular
Get popular search queries.

**Query Parameters:**
- `limit` (optional): Number of queries (1-50, default: 10)

**Response:**
```json
{
  "popularSearches": [
    {
      "query": "gaming chair",
      "search_count": 342,
      "last_searched": "2024-01-15T14:30:00Z"
    }
  ]
}
```

#### GET /api/search/history
Get user's search history.

**Query Parameters:**
- `limit` (optional): Number of items (1-100, default: 20)

**Response:**
```json
{
  "history": [
    {
      "id": 1,
      "user_id": 1,
      "query": "gaming chair",
      "result_count": 15,
      "searched_at": "2024-01-15T14:30:00Z"
    }
  ]
}
```

#### DELETE /api/search/history
Clear user's search history.

#### GET /api/search/filters
Get available filters for entity type.

**Query Parameters:**
- `type` (required): Entity type (product, user, post)

**Response:**
```json
{
  "filters": {
    "price": { "type": "range", "min": 0, "max": 10000 },
    "category": { "type": "select", "options": [] },
    "rating": { "type": "range", "min": 0, "max": 5 }
  },
  "entityType": "product"
}
```

### Recommendations

#### GET /api/recommendations
Get personalized recommendations.

**Query Parameters:**
- `type` (optional): Entity type filter
- `limit` (optional): Number of recommendations (1-50, default: 10)

**Response:**
```json
{
  "recommendations": [
    {
      "id": 1,
      "user_id": 1,
      "entity_type": "product",
      "entity_id": 42,
      "score": 0.85,
      "reason": "Based on your recent views",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/recommendations
Create recommendation (typically called by recommendation engine).

**Request Body:**
```json
{
  "entityType": "product",
  "entityId": 42,
  "score": 0.85,
  "reason": "Based on your recent views"
}
```

#### DELETE /api/recommendations
Clear all user recommendations.

#### DELETE /api/recommendations/[id]
Delete specific recommendation.

### Recently Viewed

#### GET /api/recently-viewed
Get recently viewed items.

**Query Parameters:**
- `type` (optional): Entity type filter
- `limit` (optional): Number of items (1-100, default: 20)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "entity_type": "product",
      "entity_id": 42,
      "viewed_at": "2024-01-15T14:30:00Z"
    }
  ]
}
```

#### POST /api/recently-viewed
Add item to recently viewed.

**Request Body:**
```json
{
  "entityType": "product",
  "entityId": 42
}
```

#### DELETE /api/recently-viewed
Clear recently viewed history.

### Saved Searches

#### GET /api/saved-searches
Get user's saved searches.

**Response:**
```json
{
  "savedSearches": [
    {
      "id": 1,
      "user_id": 1,
      "name": "Gaming Chairs Under $300",
      "query": "gaming chair",
      "filters": { "price_max": 300 },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/saved-searches
Save a search query.

**Request Body:**
```json
{
  "name": "Gaming Chairs Under $300",
  "query": "gaming chair",
  "filters": { "price_max": 300 }
}
```

#### DELETE /api/saved-searches/[id]
Delete saved search.

## Database Functions

### Search Index (4 functions)
- `indexContent({ entityType, entityId, title, content, metadata })`
- `searchContent(searchTerm, entityTypes?, limit)`
- `removeFromIndex(entityType, entityId)`
- `reindexAll()`

### Search History (4 functions)
- `saveSearchQuery(userId, query, resultCount)`
- `getUserSearchHistory(userId, limit)`
- `clearSearchHistory(userId)`
- `getPopularSearches(limit)`

### Search Suggestions (3 functions)
- `createSearchSuggestion({ suggestion, category, priority })`
- `getSearchSuggestions(prefix, limit)`
- `deleteSearchSuggestion(id)`

### Trending Content (3 functions)
- `trackView({ entityType, entityId, userId })`
- `getTrendingContent(entityType?, limit, timeWindow)`
- `resetTrendingCounts()`

### Saved Searches (3 functions)
- `saveSearch(userId, name, query, filters)`
- `getSavedSearches(userId)`
- `deleteSavedSearch(id, userId)`

### Recommendations (4 functions)
- `createRecommendation({ userId, entityType, entityId, score, reason })`
- `getUserRecommendations(userId, entityType?, limit)`
- `deleteRecommendation(id, userId)`
- `clearUserRecommendations(userId)`

### Recently Viewed (3 functions)
- `addToRecentlyViewed(userId, entityType, entityId)`
- `getRecentlyViewed(userId, entityType?, limit)`
- `clearRecentlyViewed(userId)`

### Search Filters (1 function)
- `getAvailableFilters(entityType)`

### Search Analytics (3 functions)
- `trackSearchAnalytics({ userId, query, resultCount, clickedResults, searchDuration })`
- `getSearchAnalytics(limit, offset)`
- `getFailedSearches(limit)`

**Total: 28 database functions**

## React Hooks Examples

### useSearch Hook

```typescript
import { useState, useEffect } from 'react';

export function useSearch(query: string, entityTypes?: string[]) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length === 0) return;

    async function search() {
      setLoading(true);
      const params = new URLSearchParams({ q: query });
      if (entityTypes) {
        entityTypes.forEach(type => params.append('type', type));
      }

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      setResults(data.results);
      setLoading(false);
    }

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, entityTypes]);

  return { results, loading };
}
```

### useRecommendations Hook

```typescript
import { useState, useEffect } from 'react';

export function useRecommendations(entityType?: string) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      const params = entityType ? `?type=${entityType}` : '';
      const response = await fetch(`/api/recommendations${params}`);
      const data = await response.json();
      setRecommendations(data.recommendations);
      setLoading(false);
    }
    loadRecommendations();
  }, [entityType]);

  return { recommendations, loading };
}
```

### useTrending Hook

```typescript
import { useState, useEffect } from 'react';

export function useTrending(entityType?: string, timeWindow: number = 7) {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrending() {
      const params = new URLSearchParams({ timeWindow: timeWindow.toString() });
      if (entityType) params.append('type', entityType);

      const response = await fetch(`/api/search/trending?${params}`);
      const data = await response.json();
      setTrending(data.trending);
      setLoading(false);
    }
    loadTrending();
  }, [entityType, timeWindow]);

  return { trending, loading };
}
```

## Migration

### Migrate Search Data
```bash
POST /api/migrate/search-data
Authorization: Required (Master tier only)
```

Migrates all search and discovery data from JSON files to the database:
- Search index
- Search history
- Search suggestions
- Trending content
- Saved searches
- Recommendations
- Recently viewed
- Search analytics

**Response:**
```json
{
  "message": "Search data migration completed",
  "stats": {
    "searchIndex": 500,
    "searchHistory": 2000,
    "suggestions": 100,
    "trending": 300,
    "savedSearches": 50,
    "recommendations": 1000,
    "recentlyViewed": 800,
    "analytics": 5000,
    "totalErrors": 0
  },
  "errors": [],
  "hasMoreErrors": false
}
```

## Security Considerations

### Authentication
- All user-specific endpoints require valid session
- Anonymous users can use global search (with limitations)

### Authorization
- Search history: User can only access their own
- Recommendations: User-specific only
- Trending: Public data
- Saved searches: User can only manage their own
- Migration: Master tier only

### Validation
- Search query: 1-255 characters
- Limits: Enforced on all paginated endpoints
- Entity types: Validated against whitelist
- Score: Must be between 0 and 1

### Privacy
- Search history stored per user
- Analytics anonymized for aggregate reports
- User can clear own search history
- Recently viewed is private per user

## Performance Optimization

### Full-Text Search
- PostgreSQL tsvector with GIN index
- Weighted ranking (title > content)
- Query optimization with plainto_tsquery

### Caching Strategies
- Trending content cached with TTL
- Popular searches cached hourly
- Search suggestions pre-loaded
- Recommendations updated periodically

### Indexing
- Composite indexes on entity_type + entity_id
- GIN index on search_vector
- DESC indexes for time-based queries

### Pagination
- All list endpoints support limit/offset
- Default limits to prevent abuse
- Maximum limits enforced

## Production Deployment

### Environment Variables
```bash
NEXT_PUBLIC_USE_DATABASE=true
POSTGRES_URL=your_postgres_connection_string
```

### Database Setup
1. Create all 8 tables with indexes
2. Set up full-text search configuration
3. Run migration endpoint for existing data
4. Schedule periodic reindexing

### Recommendation Engine
- Can be run as background job
- Uses user behavior data (views, searches, purchases)
- Updates recommendations daily
- Considers collaborative filtering

### Indexing Strategy
- Index new content immediately
- Reindex updated content
- Remove deleted content from index
- Full reindex weekly

## Future Enhancements

### Potential Features
- **Advanced Filtering**: Multi-faceted search with complex filters
- **Spell Check**: Did you mean...?
- **Synonyms**: Expand search with synonyms
- **Image Search**: Search by image upload
- **Voice Search**: Speech-to-text search
- **Search within Results**: Refine results
- **Saved Filters**: Save filter combinations
- **Smart Suggestions**: ML-powered suggestions
- **Search Analytics Dashboard**: Admin insights
- **A/B Testing**: Test search algorithms

### Scalability
- Elasticsearch integration for larger datasets
- Search result caching
- Distributed search across regions
- Search query queue for heavy loads
- Read replicas for search queries

## Summary

Phase 8 provides a comprehensive search and discovery system with:
- ✅ 8 database tables
- ✅ 28 database functions
- ✅ Dual-mode storage (file & database)
- ✅ 11+ API endpoints
- ✅ Full-text search with ranking
- ✅ Trending content tracking
- ✅ Personalized recommendations
- ✅ Search history & analytics
- ✅ Saved searches
- ✅ Recently viewed tracking
- ✅ Migration endpoint
- ✅ Complete documentation
- ✅ Production-ready validation

The search system integrates with all previous phases and provides the foundation for content discovery across the entire platform.
