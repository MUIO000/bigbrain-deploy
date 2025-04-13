import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionStatus, mutateGameState } from "../../api/gameApi";
import Button from "../../components/Button";
import ErrorPopup from "../../components/ErrorPopup";
import SuccessPopup from "../../components/SuccessPopup";
import { AuthContext } from "../../contexts/AuthContext";
import { useContext } from "react";
import { extractQuestionFromFormat } from "../../utils/questionFormatter";

const SessionControl = ({ sessionId, sessionData: initialData }) => {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(initialData);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // 使用 ref 来跟踪轮询状态
  const pollingRef = useRef(true);
  const successTimeoutRef = useRef(null);

  const { logout } = useContext(AuthContext);
  const token = localStorage.getItem("token");

  // 从本地存储中获取 gameId
  const gameId = localStorage.getItem(`session_${sessionId}_gameId`);

  // 检查是否有 gameId
  useEffect(() => {
    if (!gameId) {
      setError("Game ID not found. Please return to dashboard and try again.");
      setShowError(true);
    }
  }, [gameId]);

  // 新增：返回Dashboard和Logout函数
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBackDashboard = () => {
    navigate("/dashboard");
  };

  // 清理轮询和定时器
  useEffect(() => {
    return () => {
      pollingRef.current = false;
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // 定期获取会话状态更新
  useEffect(() => {
    const fetchStatus = async () => {
      if (!pollingRef.current) return;

      try {
        const data = await getSessionStatus(token, sessionId);
        console.log("Session data:", data);
        console.log("Position:", data.position);

        setSessionData(data.results || data);

        // 如果会话已经不活跃，重新加载页面以显示结果
        if (!data.active) {
          navigate(`/session/${sessionId}`);
          return;
        }

        // 计算倒计时（如果游戏已开始）
        if (data.position >= 0 && data.isoTimeLastQuestionStarted) {
          // 提取问题对象，处理可能的嵌套格式
          const questionData = data.questions[data.position];
          const questionObject = extractQuestionFromFormat(questionData);
          
          const questionDuration = questionObject?.duration || 30;
          const startTime = new Date(data.isoTimeLastQuestionStarted);
          const endTime = new Date(
            startTime.getTime() + questionDuration * 1000
          );
          const now = new Date();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          setTimeRemaining(remaining);
        }
      } catch (err) {
        console.error("Error fetching session status:", err);
      }

      // 继续轮询，如果组件仍然挂载
      if (pollingRef.current) {
        setTimeout(fetchStatus, 1000);
      }
    };

    fetchStatus();

    return () => {
      pollingRef.current = false;
    };
  }, [token, sessionId, navigate]);

  // 处理"下一题"按钮点击
  const handleAdvance = async () => {
    if (!gameId) {
      setError("Game ID not found. Please return to dashboard and try again.");
      setShowError(true);
      return;
    }

    try {
      // 显示处理中状态
      setSuccess("Processing...");
      setShowSuccess(true);

      // 调用API推进游戏
      await mutateGameState(token, gameId, "ADVANCE");

      // 立即获取最新状态
      const updatedData = await getSessionStatus(token, sessionId);
      setSessionData(updatedData.results || updatedData);

      // 根据新位置设置成功消息
      const newPosition = updatedData.position;
      if (newPosition === 0) {
        setSuccess("Game started successfully!");
      } else {
        setSuccess("Advanced to next question");
      }
      setShowSuccess(true);

      // 使用 ref 设置自动关闭计时器
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }

      successTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
        successTimeoutRef.current = null;
      }, 3000);
    } catch (err) {
      console.error("Error advancing question:", err);
      setError(err.message || "Failed to advance question");
      setShowError(true);
    }
  };

  // 处理"结束会话"按钮点击
  const handleEndSession = async () => {
    if (!gameId) {
      setError("Game ID not found. Please return to dashboard and try again.");
      setShowError(true);
      return;
    }

    try {
      // 调用 API 结束游戏
      await mutateGameState(token, gameId, "END");
      setSuccess("Game session ended");
      setShowSuccess(true);

      // 停止轮询
      pollingRef.current = false;

      // 导航到结果页面
      setTimeout(() => {
        navigate(`/session/${sessionId}`);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to end session");
      setShowError(true);
    }
  };


  );
};

// 辅助函数，从 YouTube URL 中提取视频 ID
function getYoutubeVideoId(url) {
  if (!url) return "";

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return match && match[2].length === 11 ? match[2] : "";
}

export default SessionControl;
