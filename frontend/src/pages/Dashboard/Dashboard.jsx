import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import ErrorPopup from "../../components/ErrorPopup";
import { getAllGames, updateGames } from "../../api/gameApi";
import { AuthContext } from '../../contexts/AuthContext';

const Dashboard = () => {
  const [games, setGames] = useState([]);
  const [openNewGameDialog, setOpenNewGameDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();
  const { email, logout } = useContext(AuthContext);

  // Get token from localStorage
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesData = await getAllGames(token);
        setGames(gamesData.games);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching games:", error);
        setError("Failed to load games. Please try again.");
        setShowError(true);
        setLoading(false);
      }
    };

    fetchGames();
  }, [token]);

  const handleCreateGame = async () => {
    if (!newGameName.trim()) return;

    try {
      // Generate a random ID between 10000000 and 99999999
      const randomId = Math.floor(Math.random() * 90000000) + 10000000;
      
      // Create a new game object with ID
      const newGame = {
        id: randomId,
        name: newGameName,
        owner: email || null, // Use logged-in user email if available
        questions: [{}], // Include an empty question object as per your API structure
      };

      // Make a copy of the current games and add the new one
      const updatedGames = [...games, newGame];

      // Update the API with the new games array
      const response = await updateGames(token, updatedGames);

      // Update the local state with the response from the API
      setGames(response.games);

      // Close the dialog and reset the input
      setOpenNewGameDialog(false);
      setNewGameName("");
    } catch (error) {
      console.error("Error creating game:", error);
      setError("Failed to create game. Please try again.");
      setShowError(true);
    }
  };

  const handleDeleteGame = async () => {
    if (selectedGameId === null) return;

    try {
      // Filter out the game to delete
      const updatedGames = games.filter((_, index) => index !== selectedGameId);

      // Update the API with the new games array (after deletion)
      const response = await updateGames(token, updatedGames);

      // Update the local state with the response from the API
      setGames(response.games);

      // Close the dialog and reset the selectedGameId
      setOpenDeleteDialog(false);
      setSelectedGameId(null);
    } catch (error) {
      console.error("Error deleting game:", error);
      setError("Failed to delete game. Please try again.");
      setShowError(true);
    }
  };

  const navigateToGame = (index) => {
    navigate(`/game/${index}`);
  };

  // Calculate total duration and count questions
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
    navigate('/login');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Game Dashboard</h1>
        <div className="flex items-center space-x-3">
          <Button 
            variant="primary" 
            onClick={() => setOpenNewGameDialog(true)}
          >
            Create New Game
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading games...</p>
      ) : games.length === 0 ? (
        <p className="text-gray-600">No games available. Create your first game!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {games.map((game, index) => {
            const { questionCount, totalDuration } = getGameStats(game);
            return (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div 
                  className="h-36 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: `url(${game.thumbnail || 'https://via.placeholder.com/300x140?text=No+Thumbnail'})`
                  }}
                ></div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{game.name}</h2>
                  <p className="text-gray-600 text-sm">Questions: {questionCount}</p>
                  <p className="text-gray-600 text-sm">Duration: {totalDuration} seconds</p>
                </div>
                <div className="flex justify-between p-3 border-t">
                  <Button 
                    variant="outline" 
                    size="small"
                    onClick={() => navigateToGame(index)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="danger" 
                    size="small"
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

      {/* New Game Dialog */}
      {openNewGameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Game</h2>
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
                onClick={() => setOpenNewGameDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleCreateGame}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Game Dialog */}
      {openDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Delete Game</h2>
            <p className="text-gray-700">
              Are you sure you want to delete &quot;{selectedGameId !== null && games[selectedGameId]?.name}&quot;? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => setOpenDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDeleteGame}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Popup */}
      <ErrorPopup 
        message={error} 
        show={showError} 
        onClose={() => setShowError(false)} 
      />
    </div>
  );
};

export default Dashboard;
