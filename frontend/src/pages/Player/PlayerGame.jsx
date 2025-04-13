import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PlayerQuestion from "../../components/PlayerQuestion";
import Button from "../../components/Button";
import ErrorPopup from "../../components/ErrorPopup";
import {
  hasGameStarted,
  getQuestion,
  submitAnswers,
} from "../../api/playerApi";

const PlayerGame = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [question, setQuestion] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [answersSubmitted, setAnswersSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  // 使用 ref 来跟踪轮询状态
  const pollingRef = useRef(true);

  // 初始化时从本地存储获取玩家名称
  useEffect(() => {
    const storedName = localStorage.getItem(`player_${playerId}_name`);
    if (storedName) {
      setPlayerName(storedName);
    }
  }, [playerId]);

  // 轮询检查游戏是否已经开始
  useEffect(() => {
    const checkGameStatus = async () => {
      if (!pollingRef.current) return;

      try {
        const started = await hasGameStarted(playerId);
        setGameStarted(started);

        if (started && !answersSubmitted) {
          // 如果游戏已开始且答案未提交，获取当前问题
          fetchCurrentQuestion();
        }
      } catch (err) {
        console.error("Error checking game status:", err);
      }

      if (pollingRef.current) {
        setTimeout(checkGameStatus, 1000);
      }
    };

    checkGameStatus();

    return () => {
      pollingRef.current = false;
    };
  }, [playerId, answersSubmitted]);

  // 获取当前问题
  const fetchCurrentQuestion = async () => {
    try {
      const Data = await getQuestion(playerId);
      const questionData = Data.question[0];
      console.log("数据:", questionData);
      if (questionData) {
        setQuestion(questionData);
        console.log("获取到的问题数据:", questionData);
        // 计算剩余时间
        if (questionData.isoTimeLastQuestionStarted) {
          const startTime = new Date(questionData.isoTimeLastQuestionStarted);
          const duration = questionData.duration || 30;
          const endTime = new Date(startTime.getTime() + duration * 1000);

          // 设置倒计时
          const updateTimer = () => {
            const now = new Date();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
            setTimeRemaining(remaining);

            if (remaining > 0 && pollingRef.current) {
              requestAnimationFrame(updateTimer);
            }
          };

          updateTimer();
        }
      }
    } catch (err) {
      console.error("Error fetching question:", err);
      if (err.message === "Session has not started yet") {
        // 如果收到这个错误，意味着游戏可能结束了，重置状态
        setGameStarted(false);
        setAnswersSubmitted(false);
        setQuestion(null);
      } else {
        setError("获取问题失败: " + (err.message || "未知错误"));
        setShowError(true);
      }
    }
  };

  // 提交答案
  const handleSubmitAnswers = async (selectedAnswers) => {
    try {
      // 为判断题特别处理答案格式
      let finalAnswers;
      if (question.type === "judgement") {
        // 判断题: true 对应 1, false 对应空数组
        finalAnswers = selectedAnswers.includes(1) ? [1] : [];
      } else {
        finalAnswers = selectedAnswers;
      }

      await submitAnswers(playerId, finalAnswers);
      setAnswersSubmitted(true);
    } catch (err) {
      console.error("Error submitting answers:", err);
      setError("提交答案失败: " + (err.message || "未知错误"));
      setShowError(true);
    }
  };

  // 退出游戏
  const handleLeaveGame = () => {
    navigate("/player");
  };

  if (!gameStarted) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen p-6">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-blue-800 mb-4">
            等待游戏开始
          </h1>
          <p className="text-gray-600 mb-6">
            {playerName ? `您好，${playerName}` : "玩家"}
            ！主持人还未开始游戏，请耐心等待。
          </p>
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <Button
            variant="secondary"
            className="mt-6 bg-gray-600 text-white hover:bg-gray-700"
            onClick={handleLeaveGame}
          >
            离开游戏
          </Button>
        </div>
      </div>
    );
  }

  if (answersSubmitted) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen p-6">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">答案已提交</h1>
          <p className="text-gray-600 mb-6">请等待主持人进入下一题。</p>
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (

  );
};

export default PlayerGame;
