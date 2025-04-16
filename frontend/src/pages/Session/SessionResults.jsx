import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSessionResults } from "../../api/gameApi";
import Button from "../../components/Button";
import ErrorPopup from "../../components/ErrorPopup";
import CorrectAnswersChart from "./Charts/CorrectAnswersChart";
import ResponseTimeChart from "./Charts/ResponseTimeChart";

const SessionResults = ({ sessionId: propSessionId }) => {
  const navigate = useNavigate();
  const { sessionId: paramSessionId } = useParams();
  const sessionId = propSessionId || paramSessionId;

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [chartData, setChartData] = useState({
    correctAnswers: [],
    responseTime: [],
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        console.log("Fetching session results...");
        setLoading(true);
        const data = await getSessionResults(token, sessionId);
        processNewFormatResults(data.results);
        setResults(data.results);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching session results:", err);
        setError(err.message || "Failed to load session results");
        setShowError(true);
        setLoading(false);
      }
    };

    if (sessionId && token) {
      fetchResults();
    } else {
      setError("Session ID or authentication token not found");
      setShowError(true);
      setLoading(false);
    }
  }, [token, sessionId]);

  // 处理新格式的API返回
  const processNewFormatResults = (results) => {
    if (!Array.isArray(results) || results.length === 0) {
      return;
    }

    // 计算每个问题的正确率
    const correctAnswersData = [];
    // 计算每个问题的平均回答时间
    const responseTimeData = [];

    // 获取总问题数
    const totalQuestions = results[0].answers ? results[0].answers.length : 0;

    for (let i = 0; i < totalQuestions; i++) {
      // 对每个问题进行分析
      const questionResponses = results
        .filter((player) => player.answers && player.answers.length > i)
        .map((player) => player.answers[i]);

      if (questionResponses.length > 0) {
        // 计算正确答案率
        const correctCount = questionResponses.filter(
          (resp) => resp && resp.correct
        ).length;
        const correctPercentage = Math.round(
          (correctCount / questionResponses.length) * 100
        );

        // 计算平均响应时间（毫秒转换为秒）
        const responseTimes = questionResponses
          .filter((resp) => resp && resp.questionStartedAt && resp.answeredAt)
          .map((resp) => {
            const startTime = new Date(resp.questionStartedAt).getTime();
            const endTime = new Date(resp.answeredAt).getTime();
            return (endTime - startTime) / 1000; // 转换为秒
          });

        const avgResponseTime =
          responseTimes.length > 0
            ? Math.round(
                (responseTimes.reduce((sum, time) => sum + time, 0) /
                  responseTimes.length) *
                  10
              ) / 10
            : 0;

        correctAnswersData.push({
          questionNumber: `Q${i + 1}`,
          correctPercentage,
        });

        responseTimeData.push({
          questionNumber: `Q${i + 1}`,
          avgResponseTime,
        });
      }
    }

    setChartData({
      correctAnswers: correctAnswersData,
      responseTime: responseTimeData,
    });
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
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

  // 检查结果是否可用
  const isNewFormat = results && Array.isArray(results);

  if (!isNewFormat) {
    return (
      <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              No Results Available
            </h1>
            <p className="text-gray-600 mb-6">
              No results were found for this session. The session might not be
              completed yet.
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

  // 根据API响应格式处理数据
  let playerRankings = [];

  if (isNewFormat) {
    // 新API格式
    const totalQuestions = results[0]?.answers?.length || 0;

    playerRankings = results
      .map((player) => ({
        playerId: player.name, // 使用name作为ID
        name: player.name || "Anonymous",
        score: player.answers?.filter((ans) => ans.correct).length || 0,
        totalQuestions,
      }))
      .sort((a, b) => b.score - a.score);
  }

  // 仅显示前5名玩家
  const topPlayers = playerRankings.slice(0, 5);

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

        {/* 游戏摘要信息 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            Game Summary
          </h2>
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
              <p className="font-semibold">
                {topPlayers.length > 0 ? topPlayers[0].totalQuestions : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status:</p>
              <p className="text-green-600 font-semibold">Completed</p>
            </div>
          </div>

          {/* Top 5 Players Table */}
          <h3 className="font-semibold text-lg mb-2">Top 5 Players</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topPlayers.map((player, index) => (
                  <tr
                    key={player.playerId}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : `${index + 1}`}
                      </div>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {player.name}
                      </div>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {player.score} / {player.totalQuestions}
                      </div>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {Math.round(
                          (player.score / player.totalQuestions) * 100
                        )}
                        %
                      </div>
                    </td>
                  </tr>
                ))}
                {topPlayers.length === 0 && (
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

        {/* 图表部分 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              Correct Answers Rate
            </h2>
            <CorrectAnswersChart data={chartData.correctAnswers} />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              Average Response Time
            </h2>
            <ResponseTimeChart data={chartData.responseTime} />
          </div>
        </div>

        {/* 其他有趣的统计信息 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            Game Insights
          </h2>

          {/* 查找最快/最慢的问题 */}
          {chartData.responseTime.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">
                  Fastest Question
                </h3>
                {(() => {
                  const fastest = [...chartData.responseTime].sort(
                    (a, b) => a.avgResponseTime - b.avgResponseTime
                  )[0];
                  return fastest ? (
                    <div>
                      <p className="text-lg font-bold">
                        {fastest.questionNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        Average response time: {fastest.avgResponseTime} seconds
                      </p>
                    </div>
                  ) : (
                    <p>No data available</p>
                  );
                })()}
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">
                  Slowest Question
                </h3>
                {(() => {
                  const slowest = [...chartData.responseTime].sort(
                    (a, b) => b.avgResponseTime - a.avgResponseTime
                  )[0];
                  return slowest ? (
                    <div>
                      <p className="text-lg font-bold">
                        {slowest.questionNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        Average response time: {slowest.avgResponseTime} seconds
                      </p>
                    </div>
                  ) : (
                    <p>No data available</p>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 最容易/最困难的问题 */}
          {chartData.correctAnswers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">
                  Easiest Question
                </h3>
                {(() => {
                  const easiest = [...chartData.correctAnswers].sort(
                    (a, b) => b.correctPercentage - a.correctPercentage
                  )[0];
                  return easiest ? (
                    <div>
                      <p className="text-lg font-bold">
                        {easiest.questionNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {easiest.correctPercentage}% of players answered
                        correctly
                      </p>
                    </div>
                  ) : (
                    <p>No data available</p>
                  );
                })()}
              </div>


    </div>
  );
};

export default SessionResults;
