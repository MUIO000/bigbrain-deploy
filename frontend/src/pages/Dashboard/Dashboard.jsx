import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import ErrorPopup from "../../components/ErrorPopup";
import SuccessPopup from "../../components/SuccessPopup"; 
import { getAllGames, updateGames } from "../../api/gameApi";
import { AuthContext } from "../../contexts/AuthContext";

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
  
  const navigate = useNavigate();
  const { email, logout } = useContext(AuthContext);

  const token = localStorage.getItem("token");

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
        return total + (parseInt(question.timeLimit) || 0);
      }, 0);
    }

    return { questionCount, totalDuration };
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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
        <p className="text-blue-600">No games available. Create your first game!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {games.map((game, index) => {
            const { questionCount, totalDuration } = getGameStats(game);
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div
                  className="h-36 bg-cover bg-center flex items-center justify-center"
                  style={{
                    backgroundImage: game.thumbnail
                      ? `url(${game.thumbnail})`
                      : "none",
                    backgroundColor: game.thumbnail ? "transparent" : "#e0e0e0",
                  }}
                >
                  {!game.thumbnail && (
                    <span className="text-gray-500 text-lg">No Thumbnail</span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2 text-blue-800">
                    {game.name}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Questions: {questionCount}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Duration: {totalDuration} seconds
                  </p>
                </div>
                <div className="flex justify-between p-3 border-t">
                  <Button
                    variant="outline"
                    size="small"
                    className="text-blue-600 border-blue-600 hover:bg-blue-100"
                    onClick={() => navigateToGame(game)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    className="bg-red-600 text-white hover:bg-red-700"
                    onClick={() => {
                      setSelectedGameId(index);
                      setOpenDeleteDialog(true);
                    }}
                  >
                    Delete
                  </Button>
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
              Are you sure you want to delete "
              {selectedGameId !== null && games[selectedGameId]?.name}"? This
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
