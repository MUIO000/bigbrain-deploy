import { useState } from 'react';
import { AuthContext } from './AuthContext.jsx';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [email, setEmail] = useState(localStorage.getItem('email') || null);

  const login = (newToken, userEmail) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  
    if (userEmail) {
      localStorage.setItem('email', userEmail);
      setEmail(userEmail);
    }
  };

  const logout = () => {
    localStorage.removeItem('email');
    localStorage.removeItem('token');
    setToken(null);
    setEmail(null);
  };

  return (
    <AuthContext.Provider value={{ token, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
