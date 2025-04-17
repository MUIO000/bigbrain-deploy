import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { joinGameSession } from '../../api/player';
import Button from '../../components/Button';
import InputField from '../../components/InputField';
import ErrorPopup from '../../components/ErrorPopup';

const PlayJoin = () => {
  const { sessionId: urlSessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get session ID from URL or query parameters
  const queryParams = new URLSearchParams(location.search);
  const querySessionId = queryParams.get('session');

  const [sessionId, setSessionId] = useState(urlSessionId || querySessionId || '');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleJoinGame = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await joinGameSession(sessionId, playerName);
      if (response && response.playerId) {
        localStorage.setItem(`playerName_${response.playerId}`, playerName);
        navigate(`/play/game/${response.playerId}`);
      }
    } catch (error) {
      console.error("Error joining game:", error);
      setError(error.message || "Failed to join game");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-800 p-4 overflow-hidden relative">
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
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center transition-all duration-300 hover:-translate-y-2 hover:scale-102 hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)]">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 drop-shadow">Join Game</h1>
        <form onSubmit={handleJoinGame} className="w-full">
          <div className="mb-4">
            <InputField
              label="Session ID"
              id="sessionId"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Enter session ID"
              disabled={!!urlSessionId || !!querySessionId}
              required
            />
          </div>
          <div className="mb-6">
            <InputField
              label="Your Name"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="bg-blue-600 text-white hover:bg-blue-700 w-full py-2 rounded-lg font-semibold shadow"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Game'}
          </Button>
        </form>
        <ErrorPopup
          message={error}
          show={showError}
          onClose={() => setShowError(false)}
        />
      </div>
    </div>
  );
};

export default PlayJoin;