import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthContext } from '../../hooks/useAuthContext';
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import ErrorPopup from "../../components/ErrorPopup";

const Login = () => {
  const { userLogin, error, setError, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { token } = useAuthContext();
  const navigate = useNavigate();

  // If token exists, redirect to dashboard
  useEffect(() => {
    if (token) {
      navigate("/dashboard");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await userLogin(email, password);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      console.error("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-800 p-4 overflow-hidden relative">
      {/* brain SVG */}
      <div className="absolute z-0 opacity-5 animate-pulse">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-96 w-96 text-blue-200"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Floating bubbles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-blue-400 opacity-20`}
            style={{
              width: `${Math.random() * 30 + 10}px`,
              height: `${Math.random() * 30 + 10}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="flex items-center justify-center mb-4 z-10">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold ml-3 text-white">BigBrain</h1>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="backdrop-blur-sm bg-white bg-opacity-10 rounded-2xl border border-white border-opacity-20 shadow-2xl overflow-hidden">
          {/* Gradient Header */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-black text-center mb-6">
              Power Up Your Brain!
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Email"
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="bg-white/20 border-white/30 text-black placeholder-white/50"
              />

              <InputField
                label="Password"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/20 border-white/30 text-black placeholder-white/50"
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg transform transition hover:-translate-y-0.5 shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white/70"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-black/70">
                No account yet?{" "}
                <a
                  href="/register"
                  className="text-blue-300 hover:text-blue-200 hover:underline font-medium"
                >
                  Join us!
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <ErrorPopup
        message={error}
        show={!!error}
        onClose={() => setError(null)}
      />

      {/* Footer */}
      <div className="text-white/40 text-xs mt-8 text-center z-10">
        © 2025 BigBrain Quiz Platform. Challenge your mind.
      </div>
    </div>
  );
};

export default Login;
