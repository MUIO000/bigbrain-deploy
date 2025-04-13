import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionResults } from '../../api/gameApi';
import Button from '../../components/Button';
import ErrorPopup from '../../components/ErrorPopup';
import { extractQuestionFromFormat } from '../../utils/questionFormatter';

const SessionResults = ({ sessionId }) => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await getSessionResults(token, sessionId);
        setResults(data.results || data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching session results:', err);
        setError(err.message || 'Failed to load session results');
        setShowError(true);
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [token, sessionId]);
  
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-blue-800 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }
  
  if (!results || !results.questions || !Array.isArray(results.questions)) {
    return (
      <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">No Results Available</h1>
            <p className="text-gray-600 mb-6">
              No results were found for this session. The session might not be completed yet.
            </p>
            <Button
              variant="primary"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleBackToDashboard}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
        <ErrorPopup
          message={error}
          show={showError}
          onClose={() => setShowError(false)}
        />
      </div>
    );
  }
  
  // 提取非嵌套格式的问题对象
  const processedQuestions = results.questions.map(q => extractQuestionFromFormat(q));
  
  // 计算玩家分数的排序
  const playerRankings = Object.entries(results.players || {})
    .map(([playerId, data]) => ({
      playerId,
      name: data.name || 'Anonymous',
      score: data.answers.reduce((total, ans) => total + (ans.correct ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score);
  
  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">Session Results</h1>
          <Button
            variant="primary"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleBackToDashboard}
          >
            Back to Dashboard
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Game Summary</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Session ID:</p>
              <p className="font-mono">{sessionId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Players:</p>
              <p className="font-semibold">{playerRankings.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Questions:</p>
              <p className="font-semibold">{processedQuestions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status:</p>
              <p className="text-green-600 font-semibold">Completed</p>
            </div>
          </div>
          
          <h3 className="font-semibold text-lg mb-2">Player Rankings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {playerRankings.map((player, index) => (
                  <tr key={player.playerId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{index + 1}</div>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{player.name}</div>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{player.score} / {processedQuestions.length}</div>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {Math.round((player.score / processedQuestions.length) * 100)}%
                      </div>
                    </td>
                  </tr>
                ))}
                {playerRankings.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-gray-500">
                      No players found for this session
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Question Analysis</h2>
          {processedQuestions.map((question, index) => {
            // 计算每个问题的统计信息
            const totalAnswers = Object.values(results.players || {}).reduce((count, player) => {
              return count + (player.answers[index] ? 1 : 0);
            }, 0);
            
            const correctAnswers = Object.values(results.players || {}).reduce((count, player) => {
              return count + (player.answers[index]?.correct ? 1 : 0);
            }, 0);
            
            const correctPercentage = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
            
            return (
              <div key={index} className="border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">
                    Question {index + 1}: {question.text}
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    correctPercentage > 70 ? 'bg-green-100 text-green-800' :
                    correctPercentage > 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {correctPercentage}% correct
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {correctAnswers} out of {totalAnswers} players answered correctly
                </p>
                
                {/* 显示问题的正确答案 */}
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Correct answer(s):</p>
                  {question.type === "judgement" ? (
                    <p className="text-sm">
                      {Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0 ? "True" : "False"}
                    </p>
                  ) : (
                    <ul className="list-disc pl-5 text-sm">
                      {Array.isArray(question.correctAnswers) && question.correctAnswers.map((answer, i) => (
                        <li key={i}>{answer}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <ErrorPopup
        message={error}
        show={showError}
        onClose={() => setShowError(false)}
      />
    </div>
  );
};

export default SessionResults;
