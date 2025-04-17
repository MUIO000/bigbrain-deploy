import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import ErrorPopup from "../../components/ErrorPopup";
import SuccessPopup from "../../components/SuccessPopup";
import { getAllGames, updateGames, mutateGameState } from "../../api/gameApi";
import { AuthContext } from "../../contexts/AuthContext";
import StartSessionPopup from "../../components/StartSessionPopup";

const Dashboard = () => {
  const [games, setGames] = useState([]);
  const [openNewGameDialog, setOpenNewGameDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // game session state
  const [activeSession, setActiveSession] = useState(null);
  const [showSessionPopup, setShowSessionPopup] = useState(false);

  // 添加停止会话的功能
  const [showStopSessionDialog, setShowStopSessionDialog] = useState(false);
  const [stoppedSessionId, setStoppedSessionId] = useState(null);

  const navigate = useNavigate();
  const { email, logout } = useContext(AuthContext);
  const token = localStorage.getItem("token");

  // check if any game is active
  const anyGameActive = games.some(game => Boolean(game.active));

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesData = await getAllGames(token);
        if (gamesData && Array.isArray(gamesData.games)) {
          setGames(gamesData.games);
        } else {
          setGames([]);
        }
        setLoading(false);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        setError("Failed to load games. Please try again.");
        setShowError(true);
        setLoading(false);
        setGames([]);
      }
    };

    fetchGames();
  }, [token]);

  const handleCreateGame = async () => {
    if (!newGameName.trim()) return;

    try {
      const randomId = Math.floor(Math.random() * 90000000) + 10000000;
      const newGame = {
        id: randomId,
        name: newGameName,
        owner: email || null,
        questions: [],
        thumbnail: "",
        active: 0,
      };

      const updatedGames = [...games, newGame];
      const response = await updateGames(token, updatedGames);

      if (response && Array.isArray(response.games)) {
        setGames(response.games);
      } else {
        const refreshedData = await getAllGames(token);
        if (refreshedData && Array.isArray(refreshedData.games)) {
          setGames(refreshedData.games);
        }
      }

      setOpenNewGameDialog(false);
      setNewGameName("");

      setSuccess("Game created successfully");
      setShowSuccess(true);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setError("Failed to create game. Please try again.");
      setShowError(true);
    }
  };

  const handleDeleteGame = async () => {
    if (selectedGameId === null) return;

    try {
      const updatedGames = games.filter((_, index) => index !== selectedGameId);
      const response = await updateGames(token, updatedGames);

      if (response && Array.isArray(response.games)) {
        setGames(response.games);
      } else {
        const refreshedData = await getAllGames(token);
        if (refreshedData && Array.isArray(refreshedData.games)) {
          setGames(refreshedData.games);
        }
      }

      setOpenDeleteDialog(false);
      setSelectedGameId(null);

      setSuccess("Game deleted successfully");
      setShowSuccess(true);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setError("Failed to delete game. Please try again.");
      setShowError(true);
    }
  };

  const navigateToGame = (game) => {
    navigate(`/game/${game.id}`);
  };

  const getGameStats = (game) => {
    const questionCount = game.questions ? game.questions.length : 0;
    let totalDuration = 0;

    if (game.questions && game.questions.length > 0) {
      totalDuration = game.questions.reduce((total, question) => {
        return total + (parseInt(question.duration) || 0);
      }, 0);
    }

    return { questionCount, totalDuration };
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleStartSession = async (gameIndex) => {
    try {
      const gameId = games[gameIndex].id;

      // Check if the game is already active
      if (games[gameIndex].active) {
        setError(
          `Game "${games[gameIndex].name}" already has an active session`
        );
        setShowError(true);
        return;
      }

      // Start the game session
      const res = await mutateGameState(token, gameId, "START");
      const response = res.data || res;

      // 更新状态
      if (response && response.sessionId) {
        console.log("成功开启游戏");
        // 为了在UI中反映变化，更新本地游戏数据
        const updatedGames = [...games];
        updatedGames[gameIndex] = {
          ...updatedGames[gameIndex],
          active: response.sessionId,
        };
        setGames(updatedGames);

        // 设置活跃游戏和会话
        setActiveSession(response.sessionId);

        // 在本地存储或状态中保存 gameId 和 sessionId 的映射关系
        localStorage.setItem(`session_${response.sessionId}_gameId`, gameId);

        // 显示会话信息弹窗
        setShowSessionPopup(true);
      }
    } catch (error) {
      setError(
        `Failed to start game session: ${error.message || "Unknown error"}`
      );
      setShowError(true);
    }
  };

  // 添加停止会话函数
  const handleStopSession = async (gameIndex) => {
    try {
      const gameId = games[gameIndex].id;
      const sessionId = games[gameIndex].active;

      if (!sessionId) {
        setError(
          `Game "${games[gameIndex].name}" doesn't have an active session`
        );
        setShowError(true);
        return;
      }

      // 调用API停止游戏会话
      await mutateGameState(token, gameId, "END");

      // 更新本地状态
      const updatedGames = [...games];
      updatedGames[gameIndex] = {
        ...updatedGames[gameIndex],
        active: null,
      };
      setGames(updatedGames);

      // 设置当前停止的会话ID，用于弹窗
      setStoppedSessionId(sessionId);

      // 显示停止会话确认弹窗
      setShowStopSessionDialog(true);
    } catch (error) {
      setError(
        `Failed to stop game session: ${error.message || "Unknown error"}`
      );
      setShowError(true);
    }
  };

  // 添加查看结果的函数
  const handleViewResults = () => {
    // 使用activeGameIndex和stoppedSessionId导航到结果页面
    navigate(`/session/${stoppedSessionId}`);
    setShowStopSessionDialog(false);
  };

  // 关闭会话弹窗
  const handleCloseSessionPopup = () => {
    setShowSessionPopup(false);
  };

  // 关闭停止会话弹窗
  const handleCloseStopSessionDialog = () => {
    setShowStopSessionDialog(false);
    setStoppedSessionId(null);
  };

  // 确认删除游戏
  const handleConfirmDelete = (index) => {
    setSelectedGameId(index);
    setOpenDeleteDialog(true);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-blue-800">Game Dashboard</h1>
        <div className="flex items-center space-x-3">
          <Button
            variant="primary"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setOpenNewGameDialog(true)}
          >
            Create New Game
          </Button>
          <Button
            variant="secondary"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-blue-600">Loading games...</p>
      ) : games.length === 0 ? (
        <p className="text-blue-600">
          No games available. Create your first game!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {games.map((game, index) => {
            const { questionCount, totalDuration } = getGameStats(game);
            const isActive = Boolean(game.active);

            return (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ${
                  isActive ? "bg-green-50" : ""
                }`}
                style={{
                  boxShadow: isActive
                    ? "0 0 15px 5px rgba(52, 211, 153, 0.3)"
                    : undefined,
                  transition: "all 0.3s ease-in-out",
                }}
              >
                <div
                  className="h-36 bg-cover bg-center flex items-center justify-center"
                  style={{
                    backgroundImage: game.thumbnail
                      ? `url(${game.thumbnail})`
                      : "none",
                    backgroundColor: game.thumbnail
                      ? "transparent"
                      : isActive
                        ? "#dcfce7"
                        : "#e0e0e0",
                  }}
                >
                  {!game.thumbnail && (
                    <span
                      className={
                        isActive
                          ? "text-green-700 text-lg"
                          : "text-gray-500 text-lg"
                      }
                    >
                      {isActive ? "Active Session" : "No Thumbnail"}
                    </span>
                  )}
                </div>
                <div className={isActive ? "p-4 bg-green-50" : "p-4"}>
                  <h2
                    className={`text-xl font-semibold mb-2 ${
                      isActive ? "text-green-800" : "text-blue-800"
                    }`}
                  >
                    {game.name}
                  </h2>
                  <p
                    className={`text-sm ${
                      isActive ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    Questions: {questionCount}
                  </p>
                  {!isActive && (
                    <p
                      className={`text-sm ${
                        isActive ? "text-green-600" : "text-gray-600"
                      }`}
                    >
                      Duration: {totalDuration} seconds
                    </p>
                  )}
                  {isActive && (
                    <div className="mt-2 flex items-center">
                      <span
                        className="w-2 h-2 rounded-full bg-green-500 mr-2"
                        style={{
                          animation:
                            "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                          boxShadow: "0 0 5px rgba(52, 211, 153, 0.5)",
                        }}
                      ></span>
                      <p className="text-sm font-medium text-green-600">
                        Session ID: {game.active}
                      </p>
                    </div>
                  )}
                </div>
                <div
                  className={`flex justify-between p-3 border-t ${
                    isActive ? "border-green-200 bg-green-50" : ""
                  }`}
                >
                  <Button
                    variant="outline"
                    size="small"
                    className={
                      isActive
                        ? "text-green-600 border-green-600 hover:bg-green-100"
                        : "text-blue-600 border-blue-600 hover:bg-blue-100"
                    }
                    onClick={() => navigateToGame(game)}
                    disabled={isActive}
                  >
                    Edit
                  </Button>
                  <div className="flex space-x-2">
                    {!isActive ? (
                      <Button
                        variant="success"
                        size="small"
                        className="bg-green-600 text-white hover:bg-green-700"
                        onClick={() => handleStartSession(index)}
                        disabled={game.questions.length === 0 || anyGameActive}
                      >
                        Start
                      </Button>
                    ) : (
                      <Button
                        variant="warning"
                        size="small"
                        className="bg-yellow-600 text-white hover:bg-yellow-700"
                        onClick={() => handleStopSession(index)}
                      >
                        Stop
                      </Button>
                    )}
                    {isActive && (
                      <Button
                        variant="info"
                        size="small"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => {
                          const gameId = games[index].id;
                          localStorage.setItem(
                            `session_${game.active}_gameId`,
                            gameId
                          );
                          navigate(`/session/${game.active}`);
                        }}
                      >
                        View Session
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="small"
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => handleConfirmDelete(index)}
                      disabled={isActive}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openNewGameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">
              Create New Game
            </h2>
            <InputField
              label="Game Name"
              id="name"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              placeholder="Enter game name"
              required
            />
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="secondary"
                className="bg-gray-600 text-white hover:bg-gray-700"
                onClick={() => setOpenNewGameDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleCreateGame}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {openDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-800">
              Delete Game
            </h2>
            <p className="text-gray-700">
              Are you sure you want to delete &quot;
              {selectedGameId !== null && games[selectedGameId]?.name}&quot;? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="secondary"
                className="bg-gray-600 text-white hover:bg-gray-700"
                onClick={() => setOpenDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeleteGame}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {showStopSessionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">
              Game Session Stopped
            </h2>
            <p className="text-gray-700 mb-4">
              The game session has been stopped. Would you like to view the
              results?
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="secondary"
                className="bg-gray-600 text-white hover:bg-gray-700"
                onClick={handleCloseStopSessionDialog}
              >
                Close
              </Button>
              <Button
                variant="primary"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleViewResults}
              >
                View Results
              </Button>
            </div>
          </div>
        </div>
      )}

      <StartSessionPopup
        sessionId={activeSession}
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

export default Dashboard;
