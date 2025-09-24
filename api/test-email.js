const EmailService = require('../../services/email');
const BigCommerceService = require('../../services/bigcommerce');

/**
 * Test email endpoint - verifies email functionality
 * GET /api/test-email - sends a test email
 * GET /api/test-email?orders=true - sends email with today's orders
 */
module.exports = async (req, res) => {
  try {
    console.log('Starting email test...');
    
    const emailService = new EmailService();
    const testEmail = req.query.email || process.env.SENDGRID_TO_EMAIL;
    const includeOrders = req.query.orders === 'true';
    
    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'No email address provided. Use ?email=your@email.com or set SENDGRID_TO_EMAIL',
        timestamp: new Date().toISOString()
      });
    }
    
    if (includeOrders) {
      console.log('Testing email with today\'s orders...');
      const bigCommerceService = new BigCommerceService();
      const orders = await bigCommerceService.getAllOrdersWithShipping();
      
      console.log(`Found ${orders.length} orders for today`);
      
      await emailService.sendDailyOrdersEmail(orders);
      
      res.status(200).json({
        success: true,
        message: 'Test email with orders sent successfully',
        ordersCount: orders.length,
        recipient: testEmail,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('Sending simple test email...');
      await emailService.sendTestEmail(testEmail);
      
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        recipient: testEmail,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error in test email endpoint:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
