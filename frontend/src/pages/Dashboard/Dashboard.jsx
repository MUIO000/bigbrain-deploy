import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import ErrorPopup from "../../components/ErrorPopup";
import SuccessPopup from "../../components/SuccessPopup";
import { getAllGames, updateGames, mutateGameState } from "../../api/gameApi";
import { AuthContext } from "../../contexts/AuthContext";
import StartSessionPopup from "../../components/StartSessionPopup";
import ParticleBackground from "../../components/ParticleBackground";

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

  // stop session state
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

      // Check if the response contains a sessionId
      if (response && response.sessionId) {
        const updatedGames = [...games];
        updatedGames[gameIndex] = {
          ...updatedGames[gameIndex],
          active: response.sessionId,
        };
        setGames(updatedGames);

        // set active session ID
        setActiveSession(response.sessionId);

        // Store the session ID in localStorage
        localStorage.setItem(`session_${response.sessionId}_gameId`, gameId);

        // Show the session popup
        setShowSessionPopup(true);
      }
    } catch (error) {
      setError(
        `Failed to start game session: ${error.message || "Unknown error"}`
      );
      setShowError(true);
    }
  };

  // stop session function
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

      await mutateGameState(token, gameId, "END");

      const updatedGames = [...games];
      updatedGames[gameIndex] = {
        ...updatedGames[gameIndex],
        active: null,
      };
      setGames(updatedGames);

      setStoppedSessionId(sessionId);

      setShowStopSessionDialog(true);
    } catch (error) {
      setError(
        `Failed to stop game session: ${error.message || "Unknown error"}`
      );
      setShowError(true);
    }
  };

  // view results function
  const handleViewResults = () => {
    navigate(`/session/${stoppedSessionId}`);
    setShowStopSessionDialog(false);
  };

  // close session popup function
  const handleCloseSessionPopup = () => {
    setShowSessionPopup(false);
  };

  // close stop session dialog function
  const handleCloseStopSessionDialog = () => {
    setShowStopSessionDialog(false);
    setStoppedSessionId(null);
  };


  // close error popup function
  const handleConfirmDelete = (index) => {
    setSelectedGameId(index);
    setOpenDeleteDialog(true);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-400 via-blue-200 to-purple-200 overflow-x-hidden p-10">
      <ParticleBackground />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {games.map((game, index) => {
            const { questionCount, totalDuration } = getGameStats(game);
            const isActive = Boolean(game.active);

            return (
              <div
                key={index}
                className={`
                  bg-white/70 rounded-2xl shadow-xl
                  overflow-hidden
                  transition-all duration-300
                  hover:-translate-y-3 hover:scale-105 hover:shadow-2xl
                  ${isActive ? "bg-green-50 ring-2 ring-green-200" : ""}
                `}
                style={{
                  boxShadow: isActive
                    ? "0 8px 32px 0 rgba(34,197,94,0.18), 0 1.5px 8px 0 rgba(52, 211, 153, 0.15)"
                    : "0 4px 24px 0 rgba(59,130,246,0.10), 0 1.5px 8px 0 rgba(59,130,246,0.08)",
                  transition: "all 0.3s cubic-bezier(.4,2,.3,1)",
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
                <div className={`${isActive ? "bg-green-50/70" : "bg-white/50"} p-4`}>
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
                        disabled={anyGameActive}
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
