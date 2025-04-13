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
        
 
  );
};

export default PlayGame;