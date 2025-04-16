import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPlayerQuestion, getPlayerResults } from "../../api/player";
import ErrorPopup from "../../components/ErrorPopup";
// 导入现有的图表组件
import CorrectAnswersChart from "../Session/Charts/CorrectAnswersChart";
import ResponseTimeChart from "../Session/Charts/ResponseTimeChart";

const GameResults = () => {
  const navigate = useNavigate();
  const { playerId: urlPlayerId } = useParams();

  // 优先使用URL中的playerId，其次从localStorage获取
  const playerId = urlPlayerId || localStorage.getItem("playerId");

  // 使用playerID特定的键获取玩家名称
  const playerName =
    localStorage.getItem(`playerName_${playerId}`) ||
    localStorage.getItem("playerName") ||
    "Anonymous";

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [chartData, setChartData] = useState({
    correctAnswers: [],
    responseTime: [],
  });

  // 计算统计数据
  const [stats, setStats] = useState({
    correctAnswers: 0,
    incorrectAnswers: 0,
    questionsAnswered: 0,
    averageResponseTime: 0,
    score: 0,
  });

  useEffect(() => {
    if (!playerId) {
      navigate("/play");
      return;
    }

    const fetchResults = async () => {
      try {
        const answersData = await getPlayerResults(playerId);
        console.log("获取玩家结果:", answersData);
        console.log(localStorage);
        // 保存原始答案数据
        setResults({ answers: answersData });

        // 处理答案数据，计算统计信息
        if (Array.isArray(answersData)) {
          processAnswers(answersData);
          processChartData(answersData);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching results:", error);
        setError("Failed to load game results");
        setShowError(true);
        setLoading(false);
      }
    };

    fetchResults();
  }, [playerId, navigate]);

  // 处理答案数据，计算统计信息
  const processAnswers = (answers) => {
    if (!Array.isArray(answers)) return;

    // 计算正确和错误的答案数量
    const correctCount = answers.filter((answer) => answer.correct).length;
    const totalAnswered = answers.length;
    const incorrectCount = totalAnswered - correctCount;

    // 计算平均响应时间
    let totalResponseTime = 0;
    let validTimeCount = 0;

    answers.forEach((answer) => {
      if (answer.questionStartedAt && answer.answeredAt) {
        const startTime = new Date(answer.questionStartedAt).getTime();
        const endTime = new Date(answer.answeredAt).getTime();
        const responseTimeInSeconds = (endTime - startTime) / 1000;
        totalResponseTime += responseTimeInSeconds;
        validTimeCount++;
      }
    });

    const averageResponseTime =
      validTimeCount > 0
        ? Math.round((totalResponseTime / validTimeCount) * 10) / 10
        : 0;

    // 计算得分 (每个正确答案得1分)
    const score = correctCount;

    setStats({
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      questionsAnswered: totalAnswered,
      averageResponseTime,
      score,
    });
  };

  // 处理答案数据为图表所需格式
  const processChartData = (answers) => {
    const correctAnswersData = [];
    const responseTimeData = [];

    answers.forEach((answer, index) => {
      const questionNumber = `Q${index + 1}`;

      // 对于正确率图表（单人只有0%或100%）
      const correctPercentage = answer.correct ? 100 : 0;
      correctAnswersData.push({
        questionNumber,
        correctPercentage,
      });

      // 计算响应时间（毫秒转换为秒）
      if (answer.questionStartedAt && answer.answeredAt) {
        const startTime = new Date(answer.questionStartedAt).getTime();
        const endTime = new Date(answer.answeredAt).getTime();
        const responseTimeInSeconds = (endTime - startTime) / 1000;

        responseTimeData.push({
          questionNumber,
          avgResponseTime: Math.round(responseTimeInSeconds * 10) / 10,
        });
      }
    });

    setChartData({
      correctAnswers: correctAnswersData,
      responseTime: responseTimeData,
    });
  };

  // 计算额外的统计数据
  const getStatistics = () => {
    const correctCount = stats.correctAnswers || 0;
    const totalAnswered = stats.questionsAnswered || 0;

    // 计算正确率百分比
    const correctPercentage =
      totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    // 计算平均答题时间（如果API提供）
    const avgAnswerTime = stats.averageResponseTime
      ? `${stats.averageResponseTime}s`
      : "N/A";

    // 根据分数给出评价
    let performance = "";
    if (correctPercentage >= 90) {
      performance = "Outstanding! You're a BigBrain master!";
    } else if (correctPercentage >= 70) {
      performance = "Great job! You know your stuff!";
    } else if (correctPercentage >= 50) {
      performance = "Good effort! Keep learning!";
    } else if (correctPercentage >= 30) {
      performance = "Nice try! Review the material and try again!";
    } else {
      performance = "Keep practicing! You'll get better!";
    }

    return {
      correctPercentage,
      avgAnswerTime,
      performance,
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

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
