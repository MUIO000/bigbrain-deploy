import { useState, } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { joinGameSession } from '../../api/player';
import Button from '../../components/Button';
import InputField from '../../components/InputField';
import ErrorPopup from '../../components/ErrorPopup';

const PlayJoin = () => {
  const { sessionId: urlSessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 提取URL参数中的session
  const queryParams = new URLSearchParams(location.search);
  const querySessionId = queryParams.get('session');
  
  const [sessionId, setSessionId] = useState(urlSessionId || querySessionId || '');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleJoinGame = async (e) => {
    e.preventDefault();
    
    if (!sessionId.trim()) {
      setError('Session ID is required');
      setShowError(true);
      return;
    }
    
    if (!playerName.trim()) {
      setError('Player name is required');
      setShowError(true);
      return;
    }
    
    try {
      setLoading(true);
      const response = await joinGameSession(sessionId, playerName);
      
      // 保存玩家信息到localStorage或sessionStorage
      localStorage.setItem('playerId', response.playerId);
      localStorage.setItem('playerName', playerName);
      localStorage.setItem('sessionId', sessionId);
      
      // 导航到游戏页面
      navigate(`/play/game`);
    } catch (error) {
      console.error('Error joining game:', error);
      setError(error.response?.data?.error || 'Failed to join game');
      setShowError(true);
      setLoading(false);
    }
  };
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-blue-800 text-center mb-6">Join Game</h1>
        
        <form onSubmit={handleJoinGame}>
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
            className="bg-blue-600 text-white hover:bg-blue-700 w-full"
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