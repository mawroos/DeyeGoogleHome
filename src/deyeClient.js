const axios = require('axios');
const crypto = require('crypto');

class DeyeCloudClient {
  constructor(appId, appSecret, email, password, baseUrl = 'https://eu1-developer.deyecloud.com') {
    this.appId = appId;
    this.appSecret = appSecret;
    this.email = email;
    this.password = password;
    this.baseUrl = baseUrl;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Hash password using SHA256 and return lowercase hex string
   */
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex').toLowerCase();
  }

  /**
   * Authenticate and get access token
   */
  async authenticate() {
    try {
      const hashedPassword = this.hashPassword(this.password);
      const response = await axios.post(
        `${this.baseUrl}/v1.0/account/token?appId=${this.appId}`,
        {
          appSecret: this.appSecret,
          email: this.email,
          password: hashedPassword
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success && response.data.data) {
        this.accessToken = response.data.data.accessToken;
        // Token is valid for 60 days, set expiry to 59 days from now
        this.tokenExpiry = Date.now() + (59 * 24 * 60 * 60 * 1000);
        return this.accessToken;
      } else {
        throw new Error('Authentication failed: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Authentication error:', error.message);
      throw error;
    }
  }

  /**
   * Check if token is valid and refresh if needed
   */
  async ensureValidToken() {
    if (!this.accessToken || !this.tokenExpiry || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
    return this.accessToken;
  }

  /**
   * Get authorization headers
   */
  async getHeaders() {
    await this.ensureValidToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    };
  }

  /**
   * Get list of all devices
   */
  async getDeviceList(page = 1, size = 100) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/v1.0/device/list`,
        {
          page: page,
          size: size
        },
        { headers }
      );

      if (response.data && response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error('Failed to get device list: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error getting device list:', error.message);
      throw error;
    }
  }

  /**
   * Get latest data for specified devices
   */
  async getDeviceStatus(deviceSns) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/v1.0/device/latest`,
        {
          deviceSns: Array.isArray(deviceSns) ? deviceSns : [deviceSns]
        },
        { headers }
      );

      if (response.data && response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error('Failed to get device status: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error getting device status:', error.message);
      throw error;
    }
  }

  /**
   * Control device - set work mode
   */
  async setWorkMode(deviceSn, mode) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/v1.0/order/sys/workMode/update`,
        {
          deviceSn: deviceSn,
          mode: mode
        },
        { headers }
      );

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to set work mode: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error setting work mode:', error.message);
      throw error;
    }
  }

  /**
   * Control battery mode
   */
  async setBatteryMode(deviceSn, mode) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/v1.0/order/battery/modeControl`,
        {
          deviceSn: deviceSn,
          mode: mode
        },
        { headers }
      );

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to set battery mode: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error setting battery mode:', error.message);
      throw error;
    }
  }

  /**
   * Update power limit
   */
  async setPowerLimit(deviceSn, power) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/v1.0/order/sys/power/update`,
        {
          deviceSn: deviceSn,
          power: power
        },
        { headers }
      );

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to set power limit: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error setting power limit:', error.message);
      throw error;
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseUrl}/v1.0/order/${orderId}`,
        { headers }
      );

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to get order status: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error getting order status:', error.message);
      throw error;
    }
  }
}

module.exports = DeyeCloudClient;
