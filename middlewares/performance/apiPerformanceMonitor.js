/**
 * API Performance Monitoring Middleware
 * Tracks and logs API response times and identifies slow endpoints
 */

const apiPerformanceMonitor = (req, res, next) => {
  // Skip monitoring for static files
  if (req.url.startsWith('/public/')) {
    return next();
  }

  // Record start time
  const start = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to calculate and log response time
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - start;
    
    // Get request details
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;
    
    // Log all API calls with timing
    console.log(`[PERF] ${method} ${url} ${status} - ${responseTime}ms`);
    
    // Log slow API calls (over 500ms) with more details
    if (responseTime > 500) {
      console.warn(`[SLOW API] ${method} ${url} ${status} - ${responseTime}ms`);
      
      // Add additional details for debugging
      const query = JSON.stringify(req.query);
      const body = JSON.stringify(req.body);
      console.warn(`[SLOW API DETAILS] Query: ${query}, Body: ${body}`);
    }
    
    // Call original end function
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = apiPerformanceMonitor;
