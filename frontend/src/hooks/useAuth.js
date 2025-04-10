import { useState } from 'react';
import { login as loginApi, register as registerApi } from '../api/authApi';
import { useAuthContext } from './useAuthContext';

export const useAuth = () => {
  const { login } = useAuthContext();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const userLogin = async (email, password, name) => {
    setLoading(true);
    try {
      const res = await loginApi(email, password, name);
      if (res.token) {
        // The token is stored in local storage by the login function in AuthContext
        login(res.token, email);
        return true; // Indicate successful login
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const userRegister = async (email, password, name) => {
    setLoading(true);
    try {
      const res = await registerApi(email, password, name);
      if (res.token) {
        // The token is stored in local storage by the login function in AuthContext
        login(res.token, email);
        return true; // Indicate successful login
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return { userLogin, userRegister, error, loading, setError };
};
