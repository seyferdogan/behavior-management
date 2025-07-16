// API service for behavior management backend
const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  // Helper method for making HTTP requests
  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
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
      
      return await response.json();
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

  // Staff API (users with teacher role)
  async getStaff() {
    try {
      const staffResponse = await this.makeRequest('/staff');
      
      // Transform the API response to match frontend expectations
      // Convert {firstName: "Ms. Jennifer", lastName: "Brown"} to "Ms. Jennifer Brown"
      return staffResponse.map(staff => `${staff.firstName} ${staff.lastName}`);
    } catch (error) {
      console.error('Error fetching staff from API:', error);
      
      // Fallback to hardcoded list if API fails
      return [
        "Ms. Jennifer Brown",
        "Mr. Michael Davis", 
        "Mrs. Sarah Wilson",
        "Dr. Robert Johnson",
        "Ms. Lisa Anderson",
        "Mr. David Thompson",
        "Mrs. Emily White"
      ];
    }
  }

  // Health check
  async healthCheck() {
    return await this.makeRequest('/health', { 
      baseUrl: 'http://localhost:8000' // Override base URL for health check
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService; 