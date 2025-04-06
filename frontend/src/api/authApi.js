import axios from 'axios';

const API_URL = 'http://localhost:5005';

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/admin/auth/login`, { email, password });
  return response.data;
};

export const register = async (email, password, name) => {
  const response = await axios.post(`${API_URL}/admin/auth/register`, { email, password, name });
  return response.data;
};

export const logout = async () => {
  const response = await axios.post(`${API_URL}/admin/auth/logout`);
  return response.data;
}