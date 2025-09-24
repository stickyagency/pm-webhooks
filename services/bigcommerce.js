const axios = require('axios');
const config = require('../config');

class BigCommerceService {
  constructor() {
    this.baseUrl = config.bigcommerce.baseUrl;
    this.baseUrlV2 = `https://api.bigcommerce.com/stores/${config.bigcommerce.storeHash}/v2`;
    this.headers = {
      'X-Auth-Token': config.bigcommerce.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Fetch orders from BigCommerce
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of orders
   */
  async getOrders(options = {}) {
    try {
      const params = {
        limit: options.limit || 250,
        sort: 'date_created:desc',
        ...options
      };

      console.log(`[BigCommerce] Fetching orders from: ${this.baseUrlV2}/orders`);
      console.log(`[BigCommerce] Params:`, params);

      const response = await axios.get(`${this.baseUrlV2}/orders`, {
        headers: this.headers,
        params
      });

      console.log(`[BigCommerce] API Response status: ${response.status}`);
      console.log(`[BigCommerce] API Response data length: ${response.data?.length || 0}`);

      return response.data || [];
    } catch (error) {
      console.error('Error fetching orders from BigCommerce:', error.response?.data || error.message);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  /**
   * Get all orders from the last 7 days with shipping method information
   * @returns {Promise<Array>} Array of all orders with shipping info
   */
  async getAllOrdersWithShipping() {
    try {
      // Get recent orders with proper sorting
      const orders = await this.getOrders({
        limit: 50,
        sort: 'date_created:desc'
      });

      // Filter orders from today only
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const todayTime = today.getTime();
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowTime = tomorrow.getTime();

      console.log(`[BigCommerce] Found ${orders.length} total orders from API`);
      console.log(`[BigCommerce] Looking for orders between ${new Date(todayTime).toISOString()} and ${new Date(tomorrowTime).toISOString()}`);

      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.date_created);
        const orderTime = orderDate.getTime();
        const isToday = orderTime >= todayTime && orderTime < tomorrowTime;
        
        if (isToday) {
          console.log(`[BigCommerce] Found today's order: ${order.id} - ${order.date_created}`);
        }
        
        return isToday;
      });

      // Get shipping method for each order
      const ordersWithShipping = await Promise.all(
        todayOrders.map(async (order) => {
          try {
            // Get shipping addresses to find shipping method
            const shippingAddressesResponse = await axios.get(`${this.baseUrlV2}/orders/${order.id}/shipping_addresses`, {
              headers: this.headers
            });
            
            const shippingAddresses = shippingAddressesResponse.data || [];
            const shippingMethod = shippingAddresses.length > 0 ? shippingAddresses[0].shipping_method : '';
            
            return {
              ...order,
              shipping_method: shippingMethod,
              shipping_addresses: shippingAddresses
            };
          } catch (error) {
            console.error(`Error fetching shipping method for order ${order.id}:`, error.message);
            return {
              ...order,
              shipping_method: '',
              shipping_addresses: []
            };
          }
        })
      );

      return ordersWithShipping;
    } catch (error) {
      console.error('Error fetching orders with shipping:', error.message);
      throw error;
    }
  }

  /**
   * Get orders with 1-2 day delivery from today only
   * @returns {Promise<Array>} Array of orders with fast delivery
   */
  async getFastDeliveryOrders() {
    try {
      const allOrders = await this.getAllOrdersWithShipping();
      
      // Filter orders with 1-2 day delivery based on shipping method names
      const fastDeliveryOrders = allOrders.filter(order => {
        const shippingMethod = order.shipping_method || '';
        const orderNotes = order.staff_notes || '';
        const customerMessage = order.customer_message || '';
        
        // Look for specific fast delivery shipping methods
        const fastDeliveryMethods = [
          'next day air',
          '2nd day air',
          'next day',
          '2nd day',
          'overnight',
          'express',
          'rush',
          'priority',
          'expedited',
          'same day'
        ];

        const hasKeywordMatch = fastDeliveryMethods.some(method => 
          shippingMethod.toLowerCase().includes(method.toLowerCase()) ||
          orderNotes.toLowerCase().includes(method.toLowerCase()) ||
          customerMessage.toLowerCase().includes(method.toLowerCase())
        );

        return hasKeywordMatch;
      });

      return fastDeliveryOrders;
    } catch (error) {
      console.error('Error fetching fast delivery orders:', error.message);
      throw error;
    }
  }

  /**
   * Get order details including line items and shipping information
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} Order with line items and shipping info
   */
  async getOrderDetails(orderId) {
    try {
      const [orderResponse, lineItemsResponse, shippingAddressesResponse, consignmentsResponse] = await Promise.all([
        axios.get(`${this.baseUrlV2}/orders/${orderId}`, {
          headers: this.headers
        }),
        axios.get(`${this.baseUrlV2}/orders/${orderId}/products`, {
          headers: this.headers
        }),
        axios.get(`${this.baseUrlV2}/orders/${orderId}/shipping_addresses`, {
          headers: this.headers
        }),
        axios.get(`${this.baseUrlV2}/orders/${orderId}/consignments`, {
          headers: this.headers
        })
      ]);

      return {
        ...orderResponse.data,
        line_items: lineItemsResponse.data || [],
        shipping_addresses: shippingAddressesResponse.data || [],
        consignments: consignmentsResponse.data || []
      };
    } catch (error) {
      console.error(`Error fetching order details for order ${orderId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get customer details
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>} Customer details
   */
  async getCustomer(customerId) {
    try {
      const response = await axios.get(`${this.baseUrlV2}/customers/${customerId}`, {
        headers: this.headers
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error.message);
      return null;
    }
  }
}

module.exports = BigCommerceService;
