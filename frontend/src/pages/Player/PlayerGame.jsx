import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPlayerStatus,
  getPlayerQuestion,
  getPlayerCorrectAnswer,
  submitPlayerAnswer,
} from "../../api/player";
import ErrorPopup from "../../components/ErrorPopup";
import GameQuestion from "./GameQuestion";
import WaitingScreen from "./WaitingScreen";

const PlayerGame = () => {
  const navigate = useNavigate();
  const { playerId } = useParams();

  // 使用玩家ID作为键的一部分获取玩家名称
  const playerName =
    localStorage.getItem(`playerName_${playerId}`) || "Anonymous";

  // 组件状态
  const [question, setQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(null);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [lastQuestionId, setLastQuestionId] = useState(-1);
  const answerFetchingRef = useRef(false);

  // 新增: 分数和统计状态
  const [stats, setStats] = useState({
    score: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    questionsAnswered: 0,
    responseTimeTotal: 0,
  });

  // Refs
  const currentQuestionRef = useRef(null);
  const timerRef = useRef(null);
  const pollingRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const questionStartTimeRef = useRef(null);
  const lastQuestionIdRef = useRef(-1);

  // 1. 使用 useRef 来跟踪最新的游戏状态
  const gameStateRef = useRef("waiting");

  // 修改 useState 初始化，并添加跟踪逻辑
  const [gameState, setGameState] = useState(() => {
    // 尝试从本地存储恢复游戏状态
    const savedState = localStorage.getItem(`gameState_${playerId}`);
    const initialState = savedState || "waiting";
    gameStateRef.current = initialState;
    return initialState;
  });

  // 2. 创建一个包装函数来更新游戏状态，确保同时更新 ref 和 localStorage
  const updateGameState = (newState) => {
    console.log(`更新游戏状态: ${gameState} -> ${newState}`);
    // 更新 ref (同步)
    gameStateRef.current = newState;
    // 保存到 localStorage (同步)
    localStorage.setItem(`gameState_${playerId}`, newState);
    // 更新 React 状态 (异步)
    setGameState(newState);
  };

  // 轮询游戏状态
  useEffect(() => {
    if (!playerId) {
      navigate("/play");
      return;
    }

    // 尝试从localStorage恢复统计数据
    const savedStats = localStorage.getItem(`playerStats_${playerId}`);
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Failed to parse saved stats:", e);
      }
    }

    // 开始轮询游戏状态
    startPolling();

    // 清除轮询
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [playerId, navigate]);

  // 启动游戏状态轮询
  const startPolling = () => {
    // 立即执行一次
    checkGameStatus();

    // 设置轮询间隔
    pollingRef.current = setInterval(() => {
      checkGameStatus();
    }, 2000); // 从1000改为2000毫秒
  };

  // 检查游戏状态
  const checkGameStatus = async () => {
    try {
      const statusData = await getPlayerStatus(playerId);
      console.log("游戏状态:", statusData);
      // 使用 ref 获取最新状态，而不是状态变量
      console.log("当前游戏状态 (ref):", gameStateRef.current);
      console.log("当前游戏状态 (state):", gameState);
      
      if (statusData.started) {
        // 使用 ref 进行比较
        if (gameStateRef.current === "answered") {
          // 如果已经回答，只检查是否有新问题
          const hasNewQuestion = await fetchCurrentQuestion();
          if (hasNewQuestion) {
            // 有新问题时才设置active状态
            updateGameState("active");
            console.log("因为answer游戏状态更新为active");
            answerFetchingRef.current = false; // 重置标志
          }
        } else if (gameStateRef.current === "waiting") {
          // 如果在等待中，检查是否有问题并设置状态
          const hasQuestion = await fetchCurrentQuestion();
          if (hasQuestion) {
            updateGameState("active");
            console.log("游戏状态更新为active");
          }
        } else if (gameStateRef.current === "active") {
          // 如果已经是active状态，更新但不重置状态
          await fetchCurrentQuestion();
        }
      } else if (statusData.finished) {
        // 游戏已结束，前往结果页面
        console.log("游戏已结束，前往结果页面");

        // 保存最终统计数据到localStorage
        savePlayerStats();

        // 跳转到结果页面
        navigate(`/play/results/${playerId}`);
      }
    } catch (error) {
      console.error("检查游戏状态出错:", error);
      navigate(`/play/results/${playerId}`);
    }
  };

  // 获取当前问题
  const fetchCurrentQuestion = async () => {
    try {
      console.log("尝试获取当前问题...");
      const responseData = await getPlayerQuestion(playerId);
      if (responseData && responseData.question) {
        console.log("获取问题成功:", responseData.question);
        const questionData = responseData.question;
        // 使用问题 ID 作为唯一标识，而不是不存在的 position
        const questionId = responseData.question.id || 0;
        setQuestion(questionData);

        // 从服务器获取问题开始的时间
        const isoTimeLastQuestionStarted =
          responseData.question.isoTimeLastQuestionStarted;

        console.log("问题ID:", questionId);
        console.log("上一个问题ID:", lastQuestionIdRef.current);

        // 比较是否为新问题（使用问题 ID 比较）
        if (questionId !== lastQuestionIdRef.current) {
          lastQuestionIdRef.current = questionId;
          console.log("检测到新问题，ID:", questionId);
          currentQuestionRef.current = questionData;

          // 重置所有状态
          setQuestion(questionData);
          setSelectedAnswers([]);
          hasSubmittedRef.current = false;
          setCorrectAnswers(null);
          setLastQuestionId(questionId);

          // 清除现有计时器
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // 使用服务器时间计算剩余时间并启动计时器
          if (questionData.duration && isoTimeLastQuestionStarted) {
            console.log(
              "计算剩余时间，使用服务器时间:",
              isoTimeLastQuestionStarted
            );
            startTimerBasedOnServerTime(
              isoTimeLastQuestionStarted,
              questionData.duration
            );
          }

 