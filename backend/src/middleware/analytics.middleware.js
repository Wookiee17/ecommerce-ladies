const { v4: uuidv4 } = require('uuid');
const geoip = require('geoip-lite');
const { UserActivity, PageVisit, UserSession, SearchHistory } = require('../models/analytics.model');

// Parse user agent to get device info
const parseUserAgent = (userAgent) => {
  const device = {
    type: 'desktop',
    os: 'unknown',
    browser: 'unknown'
  };
  
  if (!userAgent) return device;
  
  // Detect device type
  if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
    device.type = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    device.type = 'tablet';
  }
  
  // Detect OS
  if (/windows/i.test(userAgent)) device.os = 'Windows';
  else if (/macintosh|mac os/i.test(userAgent)) device.os = 'MacOS';
  else if (/linux/i.test(userAgent)) device.os = 'Linux';
  else if (/android/i.test(userAgent)) device.os = 'Android';
  else if (/ios|iphone|ipad/i.test(userAgent)) device.os = 'iOS';
  
  // Detect browser
  if (/chrome/i.test(userAgent)) device.browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) device.browser = 'Firefox';
  else if (/safari/i.test(userAgent)) device.browser = 'Safari';
  else if (/edge/i.test(userAgent)) device.browser = 'Edge';
  
  return device;
};

// Get location from IP
const getLocationFromIP = (ip) => {
  try {
    // Remove IPv6 prefix if present
    const cleanIP = ip.replace(/^::ffff:/, '');
    const geo = geoip.lookup(cleanIP);
    
    if (geo) {
      return {
        country: geo.country,
        city: geo.city,
        region: geo.region,
        latitude: geo.ll[0],
        longitude: geo.ll[1],
        timezone: geo.timezone
      };
    }
  } catch (error) {
    console.error('GeoIP lookup error:', error);
  }
  
  return null;
};

// Track user activity middleware
const trackActivity = async (req, res, next) => {
  // Skip tracking for static assets and health checks
  if (req.path.startsWith('/uploads') || 
      req.path === '/health' || 
      req.path.startsWith('/api/health')) {
    return next();
  }
  
  try {
    const sessionId = req.headers['x-session-id'] || uuidv4();
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.ip;
    
    const device = parseUserAgent(userAgent);
    const location = getLocationFromIP(ipAddress);
    
    // Attach tracking data to request
    req.trackingData = {
      sessionId,
      device,
      location,
      ipAddress,
      userAgent,
      timestamp: new Date()
    };
    
    // Track page view for GET requests
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      await trackPageVisit(req);
    }
    
    // Set session ID in response header
    res.setHeader('X-Session-ID', sessionId);
    
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
  
  next();
};

// Track page visit
const trackPageVisit = async (req) => {
  try {
    const { sessionId, device, location, ipAddress } = req.trackingData;
    const userId = req.user?._id;
    
    const pageVisit = new PageVisit({
      userId,
      sessionId,
      page: req.path,
      entryTime: new Date(),
      device,
      location,
      ipAddress
    });
    
    await pageVisit.save();
    
    // Update or create session
    await UserSession.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          userId,
          sessionId,
          startTime: new Date(),
          device,
          location,
          ipAddress
        },
        $addToSet: { pagesVisited: req.path },
        $set: { isActive: true }
      },
      { upsert: true, new: true }
    );
    
  } catch (error) {
    console.error('Page visit tracking error:', error);
  }
};

// Track specific activity
const trackUserActivity = async (req, activityType, metadata = {}) => {
  try {
    const { sessionId, device, location, ipAddress, userAgent } = req.trackingData || {};
    const userId = req.user?._id;
    
    const activity = new UserActivity({
      userId,
      sessionId,
      activityType,
      page: req.path,
      metadata,
      device,
      location,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
    
    await activity.save();
    
  } catch (error) {
    console.error('Activity tracking error:', error);
  }
};

// Track search
const trackSearch = async (req, query, resultsCount = 0) => {
  try {
    const { sessionId, location } = req.trackingData || {};
    const userId = req.user?._id;
    
    const search = new SearchHistory({
      userId,
      sessionId,
      query,
      resultsCount,
      location,
      timestamp: new Date()
    });
    
    await search.save();
    
    // Also track as user activity
    await trackUserActivity(req, 'search', { query, resultsCount });
    
  } catch (error) {
    console.error('Search tracking error:', error);
  }
};

// End session (call when user logs out or session expires)
const endSession = async (sessionId) => {
  try {
    const session = await UserSession.findOne({ sessionId });
    
    if (session) {
      const endTime = new Date();
      const totalTimeSpent = Math.round((endTime - session.startTime) / 1000);
      
      session.endTime = endTime;
      session.totalTimeSpent = totalTimeSpent;
      session.isActive = false;
      
      await session.save();
    }
    
  } catch (error) {
    console.error('End session error:', error);
  }
};

// Update page visit exit time
const updatePageVisitExit = async (sessionId, page) => {
  try {
    const pageVisit = await PageVisit.findOne({
      sessionId,
      page,
      exitTime: { $exists: false }
    }).sort({ entryTime: -1 });
    
    if (pageVisit) {
      const exitTime = new Date();
      const timeSpent = Math.round((exitTime - pageVisit.entryTime) / 1000);
      
      pageVisit.exitTime = exitTime;
      pageVisit.timeSpent = timeSpent;
      
      await pageVisit.save();
    }
    
  } catch (error) {
    console.error('Update page visit exit error:', error);
  }
};

module.exports = {
  trackActivity,
  trackUserActivity,
  trackSearch,
  trackPageVisit,
  endSession,
  updatePageVisitExit,
  parseUserAgent,
  getLocationFromIP
};
