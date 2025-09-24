/**
 * Cron status endpoint - check if cron jobs are working
 * GET /api/cron/status - shows cron job status and last run info
 */
module.exports = async (req, res) => {
  try {
    const now = new Date();
    const utcTime = now.toISOString();
    const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // Calculate next expected run time (4pm ET = 9pm UTC)
    const nextRun = new Date();
    nextRun.setUTCHours(21, 0, 0, 0); // 9pm UTC = 4pm ET
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1); // Next day if already past today's run
    }
    
    res.status(200).json({
      success: true,
      cron: {
        enabled: true,
        schedule: "0 21 * * * (9pm UTC / 4pm ET)",
        nextRun: nextRun.toISOString(),
        nextRunET: new Date(nextRun.toLocaleString("en-US", {timeZone: "America/New_York"})).toISOString()
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'production',
        hasSendGridKey: !!process.env.SENDGRID_API_KEY,
        hasBigCommerceConfig: !!(process.env.BIGCOMMERCE_STORE_HASH && process.env.BIGCOMMERCE_ACCESS_TOKEN),
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'orders@powermanufacturing.com',
        toEmail: process.env.SENDGRID_TO_EMAIL || 'operations@powermanufacturing.com'
      },
      currentTime: {
        utc: utcTime,
        et: etTime.toISOString()
      },
      endpoints: {
        testEmail: '/api/test-email',
        testEmailWithOrders: '/api/test-email?orders=true',
        manualCron: '/api/cron/daily-orders',
        cronStatus: '/api/cron/status'
      },
      timestamp: utcTime
    });
    
  } catch (error) {
    console.error('Error in cron status endpoint:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get cron status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
