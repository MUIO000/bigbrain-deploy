import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionStatus, mutateGameState } from "../../api/gameApi";
import Button from "../../components/Button";
import ErrorPopup from "../../components/ErrorPopup";
import SuccessPopup from "../../components/SuccessPopup";
import { AuthContext } from "../../contexts/AuthContext";
import { useContext } from "react";
import { extractQuestionFromFormat } from "../../utils/questionFormatter";
import StartSessionPopup from "../../components/StartSessionPopup";

const SessionControl = ({ sessionId, sessionData: initialData }) => {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(initialData);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSessionPopup, setShowSessionPopup] = useState(false);

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

  const handleCloseSessionPopup = () => {
    setShowSessionPopup(false);
  };

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

  // 计算进度信息
  const position = sessionData.position;
  const totalQuestions = sessionData?.questions?.length || 0;

  // 获取当前问题，处理可能的嵌套格式
  let currentQuestion = null;
  if (position >= 0 && sessionData?.questions && position < totalQuestions) {
    currentQuestion = extractQuestionFromFormat(sessionData.questions[position]);
  }

  const isGameStarted = position >= 0;

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end space-x-2 mb-4">
          <Button
            variant="secondary"
            className="bg-gray-600 text-white hover:bg-gray-700"
            onClick={handleBackDashboard}
          >
            Dashboard
          </Button>
          <Button
            variant="secondary"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">Session Control</h1>
          <Button
            variant="danger"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleEndSession}
          >
            End Session
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-blue-800">
                {isGameStarted
                  ? `Question ${position + 1}/${totalQuestions}`
                  : "Game Ready"}
              </h2>
              <p className="text-sm text-gray-600">
                {isGameStarted
                  ? "Game in progress"
                  : 'Click "Start Game" to begin'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Players connected:</p>
              <p className="text-xl font-semibold text-blue-800">
                {Object.keys(sessionData?.players || {}).length}
              </p>
            </div>
          </div>

          {isGameStarted && currentQuestion && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">Current Question</h3>
                {timeRemaining !== null && (
                  <div
                    className={`px-4 py-1 rounded-full ${
                      timeRemaining > 10
                        ? "bg-green-100 text-green-800"
                        : timeRemaining > 5
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800 animate-pulse"
                    }`}
                  >
                    {timeRemaining}s remaining
                  </div>
                )}
              </div>

              <p className="text-lg mb-4">{currentQuestion.text}</p>

              {currentQuestion.attachmentType === "image" &&
                currentQuestion.attachmentUrl && (
                  <div className="mb-4">
                    <img
                      src={currentQuestion.attachmentUrl}
                      alt="Question attachment"
                      className="max-w-full rounded-lg"
                    />
                  </div>
                )}

              {currentQuestion.attachmentType === "youtube" &&
                currentQuestion.attachmentUrl && (
                  <div className="mb-4">
                    <div className="aspect-w-16 aspect-h-9">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeVideoId(
                          currentQuestion.attachmentUrl
                        )}`}
                        title="YouTube video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg w-full h-64"
                      ></iframe>
                    </div>
                  </div>
                )}

              <div className="mt-6">
                <h4 className="font-medium mb-2">Answer Options:</h4>
                {currentQuestion.type === "judgement" ? (
                  <div className="grid grid-cols-1 gap-2">
                    <div
                      className={`p-3 border rounded-lg ${
                        Array.isArray(currentQuestion.correctAnswers) &&
                        currentQuestion.correctAnswers.includes("True/False")
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                          ✓
                        </span>
                        <span>True</span>
                      </div>
                    </div>
                    <div
                      className={`p-3 border rounded-lg ${
                        !Array.isArray(currentQuestion.correctAnswers) ||
                        currentQuestion.correctAnswers.length === 0
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                          ✗
                        </span>
                        <span>False</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* 使用新的 Answers 格式 */}
                    {Array.isArray(currentQuestion.Answers) &&
                      currentQuestion.Answers.map((answerObj, i) => {
                        // 从 Answers 中获取答案文本
                        const answerText = answerObj.Answer;
                        return (
                          <div
                            key={i}
                            className={`p-3 border rounded-lg ${
                              Array.isArray(currentQuestion.correctAnswers) &&
                              currentQuestion.correctAnswers.includes(answerText)
                                ? "border-green-300 bg-green-50"
                                : "border-gray-300 bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                {i + 1}
                              </span>
                              <span>{answerText}</span>
                            </div>
                          </div>
                        );
                      })}
                    
                    {/* 兼容旧格式 answers */}
                    {Array.isArray(currentQuestion.answers) && !Array.isArray(currentQuestion.Answers) &&
                      currentQuestion.answers.map((answer, i) => (
                        <div
                          key={i}
                          className={`p-3 border rounded-lg ${
                            Array.isArray(currentQuestion.correctAnswers) &&
                            currentQuestion.correctAnswers.includes(answer.text)
                              ? "border-green-300 bg-green-50"
                              : "border-gray-300 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                              {i + 1}
                            </span>
                            <span>{answer.text}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button
              variant="primary"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleAdvance}
            >
              {isGameStarted ? "Next Question" : "Start Game"}
            </Button>
            <Button
              variant="secondary"
              className="bg-gray-600 text-white hover:bg-gray-700 ml-4"
              onClick={() => setShowSessionPopup(true)}
            >
              Share Session Link
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-lg mb-3">Session Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Session ID:</p>
              <p className="font-mono">{sessionId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status:</p>
              <p
                className={isGameStarted ? "text-green-600" : "text-yellow-600"}
              >
                {isGameStarted ? "Active" : "Ready to start"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Game ID:</p>
              <p className="font-mono">{gameId || "Not available"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Question Type:</p>
              <p className="capitalize">
                {currentQuestion?.type || "Not started"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <StartSessionPopup
        sessionId={sessionId}
        show={showSessionPopup}
        onClose={handleCloseSessionPopup}
      />

      <ErrorPopup
        message={error}
        show={showError}
        onClose={() => setShowError(false)}
      />

      <SuccessPopup
        message={success}
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
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
