import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import ErrorPopup from '../../components/ErrorPopup';

const Login = () => {
  const { userLogin, error, setError, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (loginSuccess && !error && !loading) {
      navigate('/dashboard');
    }
    
    // If login fails, set loginSuccess to false
    if (error) {
      setLoginSuccess(false);
    }
  }, [loginSuccess, error, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); 
    setLoginSuccess(false); // reset loginSuccess on new attempt
    
    try {
      const success = await userLogin(email, password);
      if (success === true) {
        setLoginSuccess(true);
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setLoginSuccess(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <InputField
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-4">
          Don`t have an account?{' '}
          <a
            href="/register"
            className="text-blue-500 hover:underline"
          >
            Register
          </a>
        </p>
      </div>
      <ErrorPopup
        message={error}
        show={!!error}
        onClose={() => setError(null)}
      />
    </div>
  );
};

export default Login;

