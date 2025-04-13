import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPlayerStatus,
  getPlayerQuestion,
  getPlayerCorrectAnswer,
  submitPlayerAnswer
} from '../../api/player';
import { extractQuestionFromFormat } from '../../utils/questionFormatter';
import ErrorPopup from '../../components/ErrorPopup';
import GameQuestion from './GameQuestion';
import WaitingScreen from './WaitingScreen';

const PlayGame = () => {
  const navigate = useNavigate();
  
  // 从localStorage获取玩家信息
  const playerId = localStorage.getItem('playerId');
  const playerName = localStorage.getItem('playerName');
  
  // 组件状态
  const [gameState, setGameState] = useState('waiting'); // waiting, active, answered, results
  const [question, setQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(null);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  
  // 使用 ref 跟踪答案是否已提交
  const hasSubmittedRef = useRef(false);
  
  // 检查是否有playerId，如果没有则导航回加入页面
  useEffect(() => {
    if (!playerId) {
      navigate('/play');
    }
  }, [playerId, navigate]);
  
  // 轮询获取游戏状态
  useEffect(() => {
    // 如果没有playerId，不执行任何操作
    if (!playerId) return;
    
    const fetchGameStatus = async () => {
      try {
        const status = await getPlayerStatus(playerId);
        
        // 如果游戏已开始且活跃中（有当前问题）
        if (status.started) {
          if (gameState === 'waiting') {
            // 游戏刚开始，获取问题
            fetchCurrentQuestion();
          }
          setGameState('active');
        } 
        // 如果游戏已经结束
        else if (status.finished) {
          navigate('/play/results');
        }
        
      } catch (error) {
        console.error('Error fetching game status:', error);
        setError('Failed to get game status');
        setShowError(true);
      }
    };
    
    // 定期轮询
    fetchGameStatus();
    const interval = setInterval(fetchGameStatus, 2000);
    
    return () => clearInterval(interval);
  }, [playerId, gameState, navigate]);
  
  // 获取当前问题
  const fetchCurrentQuestion = async () => {
    try {
      const responseData = await getPlayerQuestion(playerId);
      
      let questionData = null;
      
      if (responseData && responseData.question) {
        questionData = extractQuestionFromFormat(responseData.question);
      }
      
      if (questionData) {
        setQuestion(questionData);
        console.log("获取到的问题数据:", questionData);
        
        // 重置所选答案和提交状态
        setSelectedAnswers([]);
        hasSubmittedRef.current = false;
        setCorrectAnswers(null);
        
        // 设置倒计时
        if (questionData.duration) {
          setTimeRemaining(questionData.duration);
        }
      } else {
        throw new Error('Invalid question data');
      }
      
    } catch (error) {
      console.error('Error fetching question:', error);
      setError('Failed to get current question');
      setShowError(true);
    }
  };
  
  // 倒计时逻辑
  useEffect(() => {
    if (timeRemaining === null || gameState !== 'active') return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 时间到，如果还没有提交过答案，则自动提交当前选择
          if (!hasSubmittedRef.current && selectedAnswers.length > 0) {
            submitAnswer(selectedAnswers);
          } else if (!hasSubmittedRef.current) {
            // 如果没有选择任何答案，也尝试自动提交空答案
            submitAnswer([]);
          }
          // 无论如何都获取正确答案
          fetchCorrectAnswers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, gameState, selectedAnswers]);
  
  // 提交答案到服务器 - 抽取为单独函数
  const submitAnswer = async (answers) => {
    if (hasSubmittedRef.current) return; // 防止重复提交
    
    try {
      await submitPlayerAnswer(playerId, answers);
      hasSubmittedRef.current = true; // 标记已提交
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer');
      setShowError(true);
    }
  };
  
  // 获取正确答案
  const fetchCorrectAnswers = async () => {
    try {
      const answersData = await getPlayerCorrectAnswer(playerId);
      setCorrectAnswers(answersData.answers || []);
      setGameState('answered');
    } catch (error) {
      console.error('Error fetching correct answers:', error);
    }
  };
  
  // 处理答案选择
  const handleAnswerSelect = async (answer) => {
    // 如果已经提交过答案，则不再处理选择
    if (hasSubmittedRef.current) return;
    
    try {
      let newSelectedAnswers = [];
      
      if (question.type === 'single') {
        // 单选题，只保留最新选择的答案内容
        newSelectedAnswers = [answer];
        
        // 自动提交单选题答案
        setSelectedAnswers(newSelectedAnswers);
        await submitAnswer(newSelectedAnswers);
        fetchCorrectAnswers(); // 单选题自动提交后获取正确答案
      } else if (question.type === 'multiple') {
        // 多选题，切换选择状态
        if (selectedAnswers.includes(answer)) {
          newSelectedAnswers = selectedAnswers.filter(a => a !== answer);
        } else {
          newSelectedAnswers = [...selectedAnswers, answer];
        }
        setSelectedAnswers(newSelectedAnswers);
        // 多选题不自动提交，需等待用户手动提交
      } else if (question.type === 'judgement') {
        // 判断题特殊处理
        // True 时使用 "True/False" 作为答案，False 时使用空数组
        if (answer === true) {
          newSelectedAnswers = ["True/False"];
        } else {
          newSelectedAnswers = [];
        }
        
        // 判断题也自动提交
        setSelectedAnswers(newSelectedAnswers);
        await submitAnswer(newSelectedAnswers);
        fetchCorrectAnswers(); // 判断题自动提交后获取正确答案
      }
      
    } catch (error) {
      console.error('Error handling answer selection:', error);
      setError('Failed to process answer');
      setShowError(true);
    }
  };
  
  // 手动提交多选题答案
  const handleSubmitAnswers = async () => {
    if (hasSubmittedRef.current || question.type !== 'multiple') return;
    
    try {
      await submitAnswer(selectedAnswers);
      fetchCorrectAnswers(); // 手动提交后获取正确答案
    } catch (error) {
      console.error('Error submitting answers:', error);
      setError('Failed to submit answers');
      setShowError(true);
    }
  };
  
  // 如果游戏未开始，显示等待页面
  if (gameState === 'waiting') {
    return <WaitingScreen playerName={playerName} />;
  }
  
  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">Playing as: {playerName}</h1>
          {timeRemaining !== null && gameState === 'active' && (
            <div className={`px-4 py-2 rounded-full font-bold text-white ${
              timeRemaining > 10 ? 'bg-green-500' : 
              timeRemaining > 5 ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
            }`}>
              {timeRemaining}s
            </div>
          )}
        </div>
        
        {question && (
          <GameQuestion
            question={question}
            selectedAnswers={selectedAnswers}
            onAnswerSelect={handleAnswerSelect}
            onSubmit={handleSubmitAnswers}
            correctAnswers={correctAnswers}
            gameState={gameState}
            timeRemaining={timeRemaining}
          />
        )}
        
        <ErrorPopup
          message={error}
          show={showError}
          onClose={() => setShowError(false)}
        />
      </div>
    </div>
  );
};

export default PlayGame;