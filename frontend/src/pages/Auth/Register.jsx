import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import ErrorPopup from '../../components/ErrorPopup';

const Register = () => {
  const { userRegister, error, setError, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (registerSuccess && !error && !loading) {
      navigate('/dashboard');
    }
  }, [registerSuccess, error, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setRegisterSuccess(false);
    
    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const success = await userRegister(email, password, name);
      
      if (success === true) {
        setRegisterSuccess(true);
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setRegisterSuccess(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
        <form onSubmit={handleSubmit}>
          <InputField
            label="Name"
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
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
          <InputField
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            required
          />
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-4">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-blue-500 hover:underline"
          >
            Login
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

export default Register;