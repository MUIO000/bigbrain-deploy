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
        <p className="mt-4 text-blue-800 font-medium">
          Loading your results...
        </p>
      </div>
    );
  }

  const { correctPercentage, avgAnswerTime, performance } = getStatistics();

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800">Game Results</h1>
            <p className="text-lg text-gray-600">Well done, {playerName}!</p>
          </div>

          {/* 分数显示 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center justify-center bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-medium mb-2 text-blue-800">
                Your Score
              </h2>
              <p className="text-4xl font-bold text-blue-900">{stats.score}</p>
            </div>

            <div className="flex flex-col items-center justify-center bg-green-50 p-6 rounded-lg">
              <h2 className="text-lg font-medium mb-2 text-green-800">
                Accuracy
              </h2>
              <p className="text-4xl font-bold text-green-700">
                {correctPercentage}%
              </p>
            </div>

            <div className="flex flex-col items-center justify-center bg-yellow-50 p-6 rounded-lg">
              <h2 className="text-lg font-medium mb-2 text-yellow-800">
                Avg. Time
              </h2>
              <p className="text-4xl font-bold text-yellow-700">
                {avgAnswerTime}
              </p>
            </div>
          </div>

          {/* 详细统计 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-medium mb-4 text-blue-800">
                Performance
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Questions Answered</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.questionsAnswered}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Correct Answers</p>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.correctAnswers}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Incorrect Answers</p>
                  <p className="text-2xl font-bold text-red-700">
                    {stats.incorrectAnswers}
                  </p>
                </div>
              </div>
            </div>

            {/* 进度条可视化 */}
            <div className="flex flex-col justify-center">
              <h2 className="text-xl font-medium mb-4 text-blue-800">
                Answer Summary
              </h2>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-green-700">
                      Correct: {stats.correctAnswers}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {correctPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full"
                      style={{ width: `${correctPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>Correct: {stats.correctAnswers}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span>Incorrect: {stats.incorrectAnswers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 使用现有图表组件 */}
          {chartData.correctAnswers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-medium mb-4 text-blue-800 text-center">
                Questions Performance
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">
                        Question
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.correctAnswers.map((item, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="border border-gray-200 px-4 py-2">
                          {item.questionNumber}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          <div className="flex items-center">
                            {item.correctPercentage === 100 ? (
                              <>
                                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-green-700 font-medium">
                                  Correct
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                                <span className="text-red-700 font-medium">
                                  Incorrect
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {chartData.responseTime.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-medium mb-4 text-blue-800 text-center">
                Response Time Analysis
              </h2>
              <ResponseTimeChart data={chartData.responseTime} />
            </div>
          )}

          {/* 评价和反馈 */}
          <div className="bg-indigo-50 p-6 rounded-lg text-center">
            <h2 className="text-lg font-medium mb-2 text-indigo-800 font-semibold">
              Performance Feedback
            </h2>
            <p className="text-lg text-indigo-700">{performance}</p>
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
