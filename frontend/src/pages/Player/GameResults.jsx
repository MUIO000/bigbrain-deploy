import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayerResults } from '../../api/player';
import Button from '../../components/Button';
import ErrorPopup from '../../components/ErrorPopup';

const GameResults = () => {
  const navigate = useNavigate();
  
  // 从localStorage获取玩家信息
  const playerId = localStorage.getItem('playerId');
  const playerName = localStorage.getItem('playerName');
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  
  useEffect(() => {
    if (!playerId) {
      navigate('/play');
      return;
    }
    
    const fetchResults = async () => {
      try {
        const resultsData = await getPlayerResults(playerId);
        setResults(resultsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching results:', error);
        setError('Failed to load game results');
        setShowError(true);
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [playerId, navigate]);
  
  const handlePlayAgain = () => {
    // 清除玩家信息并返回加入页面
    localStorage.removeItem('playerId');
    localStorage.removeItem('sessionId');
    navigate('/play');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
          <h1 className="text-3xl font-bold mb-4 text-blue-800">Game Results</h1>
          
          <div className="p-8 bg-blue-50 rounded-lg mb-6">
            <h2 className="text-lg font-medium mb-2 text-blue-800">Your Score</h2>
            <p className="text-5xl font-bold text-blue-900">{results?.score || 0}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4 text-blue-800">Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Correct Answers</p>
                <p className="text-2xl font-bold text-green-700">{results?.correctAnswers || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Incorrect Answers</p>
                <p className="text-2xl font-bold text-red-700">{results?.incorrectAnswers || 0}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Questions Answered</p>
                <p className="text-2xl font-bold text-yellow-700">{results?.questionsAnswered || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <Button
              variant="primary"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handlePlayAgain}
            >
              Play Another Game
            </Button>
          </div>
        </div>
        
        <ErrorPopup
          message={error}
          show={showError}
          onClose={() => setShowError(false)}
        />
      </div>
    </div>
  );
};

export default GameResults;
