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

          return true;
        } else if (currentQuestionRef.current) {
          // 如果是同一问题，仅更新剩余时间（不重置其他状态）
          setQuestion((prevQuestion) => {
            // 如果问题内容发生变化（极少情况），才更新问题
            if (JSON.stringify(prevQuestion) !== JSON.stringify(questionData)) {
              return questionData;
            }
            return prevQuestion; // 否则保持不变
          });

          if (questionData.duration && isoTimeLastQuestionStarted) {
            updateRemainingTime(
              isoTimeLastQuestionStarted,
              questionData.duration
            );
          }
        }
        return false;
      }
      return false;
    } catch (error) {
      console.error("获取问题失败:", error);
      if (error.response && error.response.status === 400) {
        console.log("问题不可用，可能游戏状态已改变");
      } else {
        setError("无法获取问题");
        setShowError(true);
      }
      return false;
    }
  };

  const startTimerBasedOnServerTime = (
    isoTimeLastQuestionStarted,
    duration
  ) => {
    // 清除现有定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 计算当前剩余时间
    const serverStartTime = new Date(isoTimeLastQuestionStarted).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - serverStartTime) / 1000);
    const remainingSeconds = Math.max(0, duration - elapsedSeconds);

    console.log("问题开始于:", new Date(serverStartTime).toLocaleTimeString());
    console.log("当前时间:", new Date(currentTime).toLocaleTimeString());
    console.log("已经过去秒数:", elapsedSeconds);
    console.log("剩余秒数:", remainingSeconds);

    // 设置剩余时间
    setTimeRemaining(remainingSeconds);

    // 记录问题开始时间（用服务器的时间）
    questionStartTimeRef.current = new Date(serverStartTime);

    // 如果还有剩余时间，启动计时器
    if (remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);

            // 如果还有选择但尚未提交，则自动提交当前选择
            if (selectedAnswers.length > 0 && !hasSubmittedRef.current) {
              submitAnswer(selectedAnswers);
            }

            console.log("时间到，获取正确答案...");

            // 获取正确答案 - 等待后端设置answerAvailable
            setTimeout(() => {
              fetchCorrectAnswers();
            }, 1500);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // 如果时间已经到了，但还没有获取答案
      if (gameState === "active" && !correctAnswers) {
        console.log("时间已到，获取正确答案...");

        // 如果还有选择但尚未提交，则自动提交当前选择
        if (selectedAnswers.length > 0 && !hasSubmittedRef.current) {
          submitAnswer(selectedAnswers);
        }

        // 获取正确答案
        setTimeout(() => {
          fetchCorrectAnswers();
        }, 1500);
      }
    }
  };

  // 新增：更新剩余时间，但不重置计时器
  const updateRemainingTime = (isoTimeLastQuestionStarted, duration) => {
    // 计算当前剩余时间
    const serverStartTime = new Date(isoTimeLastQuestionStarted).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - serverStartTime) / 1000);
    const remainingSeconds = Math.max(0, duration - elapsedSeconds);
    // 检查时间是否已到但还未获取答案
    if (
      remainingSeconds <= 0 &&
      gameState === "active" &&
      !correctAnswers &&
      !hasSubmittedRef.current
    ) {
      console.log("更新时检测到时间已到，正在获取正确答案...");

      // 如果还有选择但尚未提交，则自动提交
      if (selectedAnswers.length > 0) {
        submitAnswer(selectedAnswers);
      }
      return;
    }
    // 如果计算出的剩余时间与当前显示的不一致，更新它
    setTimeRemaining((prevTime) => {
      if (Math.abs(prevTime - remainingSeconds) > 2) {
        // 允许1-2秒的误差
        console.log("更新剩余时间:", remainingSeconds);
        return remainingSeconds;
      }
      return prevTime;
    });
  };

  // 处理答案选择
  const handleAnswerSelect = (answer) => {
    // 如果时间已到，则不处理选择
    if (timeRemaining <= 0 || gameState !== "active") return;

    let newSelectedAnswers = [];

    if (question.type === "judgement") {
      // 对于判断题，切换选择
      if (answer === true) {
        newSelectedAnswers = ["True"];
      } else {
        newSelectedAnswers = ["False"];
      }
      setSelectedAnswers(newSelectedAnswers);

      // 判断题选择后自动提交
      submitAnswer(newSelectedAnswers);
    } else if (question.type === "single") {
      // 对于单选题，替换之前的选择
      newSelectedAnswers = [answer];
      setSelectedAnswers(newSelectedAnswers);

      // 单选题选择后自动提交
      submitAnswer(newSelectedAnswers);
    } else if (question.type === "multiple") {
      // 对于多选题，切换选择
      if (selectedAnswers.includes(answer)) {
        newSelectedAnswers = selectedAnswers.filter((a) => a !== answer);
      } else {
        newSelectedAnswers = [...selectedAnswers, answer];
      }
      setSelectedAnswers(newSelectedAnswers);
      // 多选题需要手动点击提交按钮
    }
  };

  // 提交答案到服务器
  const submitAnswer = async (answers) => {
    try {
      console.log("提交答案:", answers);
      localStorage.setItem(
        `selectedAnswers_${playerId}_${lastQuestionId}`,
        JSON.stringify(answers)
      );

      await submitPlayerAnswer(playerId, answers);
      console.log("答案提交成功");

      // 记录最后提交时间，用于计算响应时间
      const answerTime = new Date();
      const responseTime = questionStartTimeRef.current
        ? (answerTime - questionStartTimeRef.current) / 1000
        : 0;

      // 临时存储本次响应时间
      localStorage.setItem(
        `questionResponseTime_${playerId}_${lastQuestionId}`,
        responseTime.toString()
      );

      // 标记为已提交，防止重复自动提交
      hasSubmittedRef.current = true;
    } catch (error) {
      console.error("提交答案失败:", error);
      setError("无法提交答案");
      setShowError(true);
    }
  };

  // 获取正确答案
  const fetchCorrectAnswers = async () => {
    try {
      if (answerFetchingRef.current) return; // 防止重复请求
      answerFetchingRef.current = true; // 设置标志，防止重复请求

      console.log("获取正确答案...");
      const answerData = await getPlayerCorrectAnswer(playerId);
      console.log("正确答案数据:", answerData);

      const responseData = await getPlayerQuestion(playerId);
      const questionId = responseData.question.id || 0;

      if (answerData && answerData.answers) {
        setCorrectAnswers(answerData.answers);
        // 使用更新函数而不是直接设置
        updateGameState("answered");
        console.log("游戏状态已更新为answered");

        let currentSelectedAnswers = [...selectedAnswers];
        // 尝试从本地存储中获取更准确的选择
        try {
          console.log(localStorage);
          console.log("lastQuestionId:", lastQuestionId);
          console.log("QuestionId:", questionId);
          setLastQuestionId(questionId);
          const storedAnswers = localStorage.getItem(
            `selectedAnswers_${playerId}_${questionId}`
          );
          if (storedAnswers) {
            currentSelectedAnswers = JSON.parse(storedAnswers);
            console.log("从本地存储恢复选择:", currentSelectedAnswers);
          }
        } catch (e) {
          console.error("读取本地存储的选择失败:", e);
        }

        // 计算是否回答正确
        const isCorrect =
          currentSelectedAnswers &&
          currentSelectedAnswers.length > 0 &&
          JSON.stringify(currentSelectedAnswers.sort()) ===
            JSON.stringify(answerData.answers.sort());

        // 更新统计信息
        updateStats(isCorrect, responseData.question.points);

        // 保存统计数据到localStorage
        savePlayerStats();
      }
    } catch (error) {
      console.error("获取正确答案失败:", error);
      setError("无法获取正确答案");
      setShowError(true);
    }
  };

  // 新增: 更新玩家统计数据
  const updateStats = (isCorrect, points) => {
    setStats((prevStats) => {
      // 计算此题得分 (可以根据需要调整得分规则)
      const questionScore = isCorrect ? points : 0;
      console.log("问题得分:", questionScore);
      // 更新统计数据
      const newStats = {
        score: prevStats.score + questionScore,
      };

      localStorage.setItem(
        `totalScore_${playerId}`,
        JSON.stringify(newStats.score)
      );
      console.log("-----------");
      console.log(localStorage);
      return newStats;
    });
  };

  // 新增: 保存玩家统计数据到localStorage
  const savePlayerStats = () => {
    try {
      localStorage.setItem(`playerStats_${playerId}`, JSON.stringify(stats));
      console.log("玩家统计数据已保存:", stats);
    } catch (e) {
      console.error("保存统计数据失败:", e);
    }
  };

  // 提交多选题答案
  const handleSubmit = () => {
    if (selectedAnswers.length === 0 || gameState !== "active") return;
    submitAnswer(selectedAnswers);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-200 to-purple-200">
      {gameState === "waiting" && (
        <div>
          <WaitingScreen playerName={playerName} />
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        {gameState === "active" && question && (
          <div className="mb-4">
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <div className="flex justify-between items-center">
                {timeRemaining !== null && (
                  <div className="text-lg font-medium">
                    Time: {timeRemaining}s
                  </div>
                )}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000"
                    style={{
                      width: `${
                        (timeRemaining / (question.duration || 1)) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <GameQuestion
              question={question}
              selectedAnswers={selectedAnswers}
              onAnswerSelect={handleAnswerSelect}
              onSubmit={handleSubmit}
              gameState={gameState}
            />
          </div>
        )}

        {gameState === "answered" && question && (
          <div>
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-blue-800">
                  Question Results
                </h3>
                <div className="text-lg font-medium">
                  Score: +
                  {selectedAnswers &&
                  correctAnswers &&
                  JSON.stringify(selectedAnswers.sort()) ===
                    JSON.stringify(correctAnswers.sort())
                    ? question.points
                    : "0"}
                </div>
              </div>
            </div>

            <GameQuestion
              question={question}
              selectedAnswers={selectedAnswers}
              onAnswerSelect={handleAnswerSelect}
              onSubmit={handleSubmit}
              correctAnswers={correctAnswers}
              gameState={gameState}
            />

            <div className="mt-4 text-center">
              <p className="text-gray-600 mb-2">
                Waiting for the next question...
              </p>
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="mt-4 text-sm text-gray-600">
                Total score so far: {stats.score}
              </div>
            </div>
          </div>
        )}
      </div>

      <ErrorPopup
        message={error}
        show={showError}
        onClose={() => setShowError(false)}
      />
    </div>
  );
};

export default PlayerGame;
