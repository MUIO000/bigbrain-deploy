import axios from 'axios';

const API_URL = 'http://localhost:5005';

/**
 * Login function to authenticate user.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @returns {Promise<object>} - Response data from the server.
 */
export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/admin/auth/login`, { email, password});
  return response.data;
};

/**
 * Register function to create a new user.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @param {string} name - User's name.
 * @returns {Promise<object>} - Response data from the server.
 */
export const register = async (email, password, name) => {
  const response = await axios.post(`${API_URL}/admin/auth/register`, { email, password, name });
  return response.data;
};

/**
 * Logout function to terminate user session.
 * @returns {Promise<object>} - Response data from the server.
 */
export const logout = async () => {
  const response = await axios.post(`${API_URL}/admin/auth/logout`);
  return response.data;
}