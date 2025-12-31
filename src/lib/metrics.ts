// Real-time metrics tracking system
interface ApiMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  error?: string;
}

interface ErrorLog {
  endpoint: string;
  method: string;
  error: string;
  stack?: string;
  timestamp: number;
  userId?: number;
}

interface MetricsData {
  requests: ApiMetric[];
  errors: ErrorLog[];
  startTime: number;
}

class MetricsCollector {
  private data: MetricsData = {
    requests: [],
    errors: [],
    startTime: Date.now()
  };
  
  private maxRequests = 1000; // Keep last 1000 requests
  private maxErrors = 100;   // Keep last 100 errors

  trackRequest(metric: Omit<ApiMetric, 'timestamp'>) {
    this.data.requests.push({
      ...metric,
      timestamp: Date.now()
    });

    // Keep only recent requests
    if (this.data.requests.length > this.maxRequests) {
      this.data.requests = this.data.requests.slice(-this.maxRequests);
    }
  }

  trackError(error: Omit<ErrorLog, 'timestamp'>) {
    this.data.errors.push({
      ...error,
      timestamp: Date.now()
    });

    // Keep only recent errors
    if (this.data.errors.length > this.maxErrors) {
      this.data.errors = this.data.errors.slice(-this.maxErrors);
    }
  }

  getStats(timeWindow: number = 60000) { // Default 1 minute
    const now = Date.now();
    const cutoff = now - timeWindow;

    const recentRequests = this.data.requests.filter(r => r.timestamp > cutoff);
    const recentErrors = this.data.errors.filter(e => e.timestamp > cutoff);

    // Calculate metrics
    const totalRequests = recentRequests.length;
    const errorCount = recentRequests.filter(r => r.statusCode >= 400).length;
    const avgResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length
      : 0;

    // Group by endpoint
    const endpointStats = new Map<string, { count: number; avgTime: number; errors: number }>();
    recentRequests.forEach(req => {
      const key = `${req.method} ${req.endpoint}`;
      const existing = endpointStats.get(key) || { count: 0, avgTime: 0, errors: 0 };
      existing.count++;
      existing.avgTime = (existing.avgTime * (existing.count - 1) + req.duration) / existing.count;
      if (req.statusCode >= 400) existing.errors++;
      endpointStats.set(key, existing);
    });

    // Top slowest endpoints
    const slowestEndpoints = Array.from(endpointStats.entries())
      .sort((a, b) => b[1].avgTime - a[1].avgTime)
      .slice(0, 10)
      .map(([endpoint, stats]) => ({ endpoint, ...stats }));

    // Status code distribution
    const statusCodes = new Map<number, number>();
    recentRequests.forEach(req => {
      statusCodes.set(req.statusCode, (statusCodes.get(req.statusCode) || 0) + 1);
    });

    return {
      timeWindow,
      totalRequests,
      errorCount,
      errorRate: totalRequests > 0 ? (errorCount / totalRequests * 100).toFixed(2) : '0',
      avgResponseTime: Math.round(avgResponseTime),
      slowestEndpoints,
      statusCodes: Object.fromEntries(statusCodes),
      recentErrors: recentErrors.slice(-10).reverse(),
      uptime: now - this.data.startTime,
      requestsPerMinute: Math.round((totalRequests / timeWindow) * 60000)
    };
  }

  getRecentErrors(limit: number = 50) {
    return this.data.errors.slice(-limit).reverse();
  }

  getAllMetrics() {
    return {
      totalRequests: this.data.requests.length,
      totalErrors: this.data.errors.length,
      startTime: this.data.startTime,
      uptime: Date.now() - this.data.startTime
    };
  }

  clear() {
    this.data = {
      requests: [],
      errors: [],
      startTime: Date.now()
    };
  }
}

export const metrics = new MetricsCollector();

// Helper to wrap API handlers with metrics tracking
export function withMetrics(
  handler: (req: any, res: any) => Promise<any>,
  endpoint: string
) {
  return async (req: any, res: any) => {
    const startTime = Date.now();
    
    try {
      await handler(req, res);
      
      metrics.trackRequest({
        endpoint,
        method: req.method || 'UNKNOWN',
        statusCode: res.statusCode || 200,
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      metrics.trackRequest({
        endpoint,
        method: req.method || 'UNKNOWN',
        statusCode: 500,
        duration,
        error: error.message
      });

      metrics.trackError({
        endpoint,
        method: req.method || 'UNKNOWN',
        error: error.message,
        stack: error.stack,
        userId: (req as any).session?.userId
      });

      throw error;
    }
  };
}
