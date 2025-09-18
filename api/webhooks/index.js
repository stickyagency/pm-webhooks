const BigCommerceService = require('../../services/bigcommerce');
const EmailService = require('../../services/email');

/**
 * Main webhook handler - routes to specific webhook handlers
 */
module.exports = async (req, res) => {
  const { method, url } = req;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Route to specific webhook handlers
    if (url.includes('/test-email')) {
      return await handleTestEmail(req, res);
    } else if (url.includes('/manual-orders')) {
      return await handleManualOrders(req, res);
    } else if (url.includes('/health')) {
      return await handleHealthCheck(req, res);
    } else {
      return res.status(404).json({
        success: false,
        message: 'Webhook endpoint not found',
        availableEndpoints: [
          '/api/webhooks/test-email',
          '/api/webhooks/manual-orders',
          '/api/webhooks/health'
        ]
      });
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Test email webhook
 */
async function handleTestEmail(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }
  
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    
    const emailService = new EmailService();
    await emailService.sendTestEmail(to);
    
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      to
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
}

/**
 * Manual orders check webhook
 */
async function handleManualOrders(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }
  
  try {
    const bigCommerceService = new BigCommerceService();
    const emailService = new EmailService();
    
    // Fetch fast delivery orders
    const orders = await bigCommerceService.getFastDeliveryOrders();
    
    // Send email notification
    await emailService.sendDailyOrdersEmail(orders);
    
    res.status(200).json({
      success: true,
      message: 'Manual orders check completed',
      ordersCount: orders.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process manual orders check',
      error: error.message
    });
  }
}

/**
 * Health check webhook
 */
async function handleHealthCheck(req, res) {
  try {
    const bigCommerceService = new BigCommerceService();
    
    // Test BigCommerce connection
    const testOrders = await bigCommerceService.getOrders({ limit: 1 });
    
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      services: {
        bigcommerce: 'connected',
        sendgrid: 'configured',
        timestamp: new Date().toISOString()
      },
      testOrdersCount: testOrders.length
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Service health check failed',
      error: error.message
    });
  }
}
