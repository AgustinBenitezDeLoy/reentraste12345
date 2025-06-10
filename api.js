/**
 * API UTILITIES - REENTRASTE
 * ===========================
 * Manejo centralizado de llamadas a la API
 * 
 * Archivo: /js/utils/api.js
 */

class APIClient {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://api.reentraste.com' 
      : 'http://localhost:3000';
    this.timeout = 30000; // 30 segundos
    this.retries = 3;
  }

  // ==========================================================================
  // CONFIGURACIÓN BASE
  // ==========================================================================

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  getMultipartHeaders() {
    const token = localStorage.getItem('token');
    const headers = {
      'Accept': 'application/json'
      // No incluir Content-Type para multipart, el browser lo hace automáticamente
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // ==========================================================================
  // MÉTODOS BASE
  // ==========================================================================

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const defaultOptions = {
      timeout: this.timeout,
      headers: options.isMultipart ? this.getMultipartHeaders() : this.getAuthHeaders(),
      ...options
    };

    // Remover isMultipart de las opciones finales
    delete defaultOptions.isMultipart;

    let lastError;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        console.log(`🌐 API Request [${attempt}/${this.retries}]:`, options.method || 'GET', endpoint);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          ...defaultOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 401) {
            this.handleUnauthorized();
            throw new APIError('No autorizado', 401);
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new APIError(
            errorData.error || `HTTP ${response.status}`, 
            response.status
          );
        }
        
        const data = await response.json();
        console.log(`✅ API Success:`, endpoint, data);
        return data;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ API Error [${attempt}/${this.retries}]:`, endpoint, error);
        
        // No reintentar en ciertos casos
        if (error.status === 401 || error.status === 403 || error.status === 404) {
          break;
        }
        
        // Esperar antes de reintentar (exponential backoff)
        if (attempt < this.retries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    throw lastError;
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET'
    });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  async postFormData(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      isMultipart: true
    });
  }

  async putFormData(endpoint, formData) {
    return this.request(endpoint, {
      method: 'PUT',
      body: formData,
      isMultipart: true
    });
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handleUnauthorized() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    if (window.showNotification) {
      window.showNotification('Sesión expirada. Por favor inicia sesión nuevamente.', 'warning');
    }
    
    // Redirigir al login después de un breve delay
    setTimeout(() => {
      if (window.router) {
        window.router.navigate('/login');
      } else {
        window.location.href = '/login';
      }
    }, 2000);
  }

  // ==========================================================================
  // ENDPOINTS ESPECÍFICOS
  // ==========================================================================

  // AUTH
  async login(email, password) {
    return this.post('/auth/login', { email, password });
  }

  async register(userData) {
    return this.post('/auth/register', userData);
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async refreshToken() {
    return this.post('/auth/refresh');
  }

  async forgotPassword(email) {
    return this.post('/auth/forgot-password', { email });
  }

  async resetPassword(token, password) {
    return this.post('/auth/reset-password', { token, password });
  }

  // USER
  async getProfile() {
    return this.get('/user/profile');
  }

  async updateProfile(userData) {
    return this.put('/user/profile', userData);
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.postFormData('/user/avatar', formData);
  }

  // EVENTS
  async getEvents(params = {}) {
    return this.get('/events', params);
  }

  async getEvent(id) {
    return this.get(`/events/${id}`);
  }

  async searchEvents(query, filters = {}) {
    return this.get('/events/search', { q: query, ...filters });
  }

  async getEventTickets(eventId, params = {}) {
    return this.get(`/events/${eventId}/tickets`, params);
  }

  // TICKETS
  async createTicket(ticketData) {
    if (ticketData instanceof FormData) {
      return this.postFormData('/tickets/create', ticketData);
    }
    return this.post('/tickets/create', ticketData);
  }

  async getTicket(id) {
    return this.get(`/tickets/${id}`);
  }

  async updateTicket(id, data) {
    return this.put(`/tickets/${id}`, data);
  }

  async deleteTicket(id) {
    return this.delete(`/tickets/${id}`);
  }

  async getMyTickets(params = {}) {
    return this.get('/tickets/my-tickets', params);
  }

  async searchTickets(query, filters = {}) {
    return this.get('/tickets/search', { q: query, ...filters });
  }

  async getPriceAnalysis(eventId, price) {
    return this.get('/tickets/price-analysis', { eventId, precio: price });
  }

  async markAsSold(ticketId) {
    return this.patch(`/tickets/${ticketId}/sold`);
  }

  async markAsAvailable(ticketId) {
    return this.patch(`/tickets/${ticketId}/available`);
  }

  // MESSAGES
  async getConversations() {
    return this.get('/messages/conversations');
  }

  async getMessages(conversationId) {
    return this.get(`/messages/conversations/${conversationId}`);
  }

  async sendMessage(conversationId, message) {
    return this.post(`/messages/conversations/${conversationId}`, { message });
  }

  async createConversation(ticketId, message) {
    return this.post('/messages/conversations', { ticketId, message });
  }

  // FAVORITES
  async getFavorites() {
    return this.get('/favorites');
  }

  async addToFavorites(ticketId) {
    return this.post('/favorites', { ticketId });
  }

  async removeFromFavorites(ticketId) {
    return this.delete(`/favorites/${ticketId}`);
  }

  // NOTIFICATIONS
  async getNotifications() {
    return this.get('/notifications');
  }

  async markNotificationAsRead(id) {
    return this.patch(`/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead() {
    return this.patch('/notifications/mark-all-read');
  }

  // ADMIN (si es necesario)
  async getAdminStats() {
    return this.get('/admin/stats');
  }

  async getAdminUsers(params = {}) {
    return this.get('/admin/users', params);
  }

  async getAdminTickets(params = {}) {
    return this.get('/admin/tickets', params);
  }

  // CATEGORIES
  async getCategories() {
    return this.get('/categories');
  }

  // LOCATIONS
  async getLocations() {
    return this.get('/locations');
  }

  async searchLocations(query) {
    return this.get('/locations/search', { q: query });
  }

  // REPORTS
  async reportTicket(ticketId, reason, description) {
    return this.post('/reports/ticket', { ticketId, reason, description });
  }

  async reportUser(userId, reason, description) {
    return this.post('/reports/user', { userId, reason, description });
  }
}

// ==========================================================================
// ERROR HANDLING
// ==========================================================================

class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// ==========================================================================
// INSTANCIA GLOBAL
// ==========================================================================

const api = new APIClient();

// Hacer disponible globalmente
window.api = api;
window.APIError = APIError;

// Para módulos ES6
export default api;
export { APIError };