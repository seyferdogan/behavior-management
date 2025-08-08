// API service for behavior management backend
const DEFAULT_API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor(baseUrl = DEFAULT_API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  getAuthToken() {
    try {
      return localStorage.getItem('authToken') || null;
    } catch (e) {
      return null;
    }
  }

  // Helper method for making HTTP requests
  async makeRequest(endpoint, options = {}) {
    const base = options.baseUrl ? options.baseUrl.replace(/\/$/, '') : this.baseUrl;
    const url = `${base}${endpoint}`;

    const authToken = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Some endpoints may not have a body (204), handle gracefully
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Students API
  async getStudents(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.grade) queryParams.append('grade', filters.grade);
    if (filters.search) queryParams.append('search', filters.search);
    
    const queryString = queryParams.toString();
    const endpoint = `/students${queryString ? `?${queryString}` : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async getStudent(id) {
    return await this.makeRequest(`/students/${id}`);
  }

  async createStudent(studentData) {
    return await this.makeRequest('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(id, studentData) {
    return await this.makeRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  }

  async deleteStudent(id) {
    return await this.makeRequest(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Incidents API
  async getIncidents(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.studentId) queryParams.append('studentId', filters.studentId);
    if (filters.severity && filters.severity !== 'All') {
      queryParams.append('severity', filters.severity);
    }
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    
    const queryString = queryParams.toString();
    const endpoint = `/incidents${queryString ? `?${queryString}` : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async getIncident(id) {
    return await this.makeRequest(`/incidents/${id}`);
  }

  async createIncident(incidentData) {
    return await this.makeRequest('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
  }

  async updateIncident(id, incidentData) {
    return await this.makeRequest(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(incidentData),
    });
  }

  async deleteIncident(id) {
    return await this.makeRequest(`/incidents/${id}`, {
      method: 'DELETE',
    });
  }

  // Staff API (normalized to {id, name})
  async getStaff() {
    const staffResponse = await this.makeRequest('/staff');
    return (staffResponse || []).map(s => ({ id: s.id, name: s.name }));
  }

  // Health check (uses absolute override)
  async healthCheck() {
    const base = process.env.REACT_APP_API_HEALTH_URL || this.baseUrl.replace(/\/$/, '').replace(/\/api$/, '');
    return await this.makeRequest('/health', { baseUrl: base });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService; 