import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import ErrorPopup from "../../components/ErrorPopup";
import SuccessPopup from "../../components/SuccessPopup";
import { getAllGames, updateGames } from "../../api/gameApi";
import { AuthContext } from "../../contexts/AuthContext";
import { useContext } from "react";
import {
  createDefaultQuestion,
  formatQuestionForBackend,
  extractQuestionFromFormat
} from '../../utils/questionFormatter';

const EditGame = () => {
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [gameName, setGameName] = useState("");
  const [gameThumbnail, setGameThumbnail] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [openNewQuestionDialog, setOpenNewQuestionDialog] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState("single");
  const { logout } = useContext(AuthContext);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const gamesData = await getAllGames(token);
        if (gamesData && Array.isArray(gamesData.games)) {
          console.log("GameId param:", gameId);
          const gameIdNum = parseInt(gameId, 10);
          console.log("Parsed GameId:", gameIdNum);
          let foundGame = gamesData.games.find((g) => g.id === gameIdNum);

          if (
            !foundGame &&
            gameIdNum >= 0 &&
            gameIdNum < gamesData.games.length
          ) {
            foundGame = gamesData.games[gameIdNum];
            console.log("Found game by index:", foundGame);
          }

          if (foundGame) {
            setGame(foundGame);
            setGameName(foundGame.name || "");
            setGameThumbnail(foundGame.thumbnail || "");
            if (foundGame.thumbnail) {
              setImagePreview(foundGame.thumbnail);
            }
            setQuestions(foundGame.questions || []);
          } else {
            setError("Game not found");
            setShowError(true);
          }
        } else {
          setError("Failed to load game data");
          setShowError(true);
        }
        setLoading(false);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        setError("An error occurred while fetching game data");
        setShowError(true);
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId, token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      setError("Please select an image file");
      setShowError(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImagePreview(dataUrl);
      setGameThumbnail(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const handleClearImage = () => {
    setImagePreview("");
    setGameThumbnail("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdateGame = async () => {
    try {
      const updatedGame = {
        ...game,
        id: game.id,
        name: gameName,
        owner: game.owner,
        questions: questions,
        thumbnail: gameThumbnail,
      };

      const gamesData = await getAllGames(token);
      if (gamesData && Array.isArray(gamesData.games)) {
        const updatedGames = gamesData.games.map((g) =>
          String(g.id) === String(game.id) ? updatedGame : g
        );

        await updateGames(token, updatedGames);

        setSuccess("Game updated successfully");
        setShowSuccess(true);
      }
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setError("Failed to update game");
      setShowError(true);
    }
  };

  const handleAddQuestion = async () => {
    try {
      // 使用工具函数创建默认问题
      const newQuestionObj = createDefaultQuestion(newQuestionType);
      
      // 使用工具函数格式化为后端需要的嵌套格式
      const formattedQuestion = formatQuestionForBackend(newQuestionObj);
      
      const updatedQuestions = [...questions, formattedQuestion];
      setQuestions(updatedQuestions);

      // 获取最新的游戏列表
      const gamesData = await getAllGames(token);
      if (gamesData && Array.isArray(gamesData.games)) {
        // 找到当前游戏的完整信息
        const currentGame = gamesData.games.find(
          (g) => String(g.id) === String(game.id)
        );

        if (currentGame) {
          // 只更新当前游戏的问题部分，保留其他所有字段
          const updatedGame = {
            ...currentGame,
            questions: updatedQuestions,
          };

          // 创建更新后的游戏列表
          const updatedGames = gamesData.games.map((g) =>
            String(g.id) === String(game.id) ? updatedGame : g
          );

          // 调用API更新后端数据
          await updateGames(token, updatedGames);

          setSuccess("New question added successfully");
          setShowSuccess(true);
        } else {
          throw new Error("Game not found in the updated games list");
        }
      }

      setOpenNewQuestionDialog(false);
    } catch (error) {
      setError("Failed to add question: " + (error.message || "Unknown error"));
      setShowError(true);
    }
  };

  const handleDeleteQuestion = async (questionIndex) => {
    try {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(questionIndex, 1);
      setQuestions(updatedQuestions);

      // 更新游戏对象，保留所有原始字段
      const updatedGame = {
        ...game, // 保留所有原始字段，包括 createdAt
        id: game.id,
        name: gameName,
        owner: game.owner,
        questions: updatedQuestions,
        thumbnail: gameThumbnail,
      };

      // 获取最新的游戏列表
      const gamesData = await getAllGames(token);
      if (gamesData && Array.isArray(gamesData.games)) {
        // 用更新后的游戏替换相应的游戏
        const updatedGames = gamesData.games.map((g) =>
          String(g.id) === String(game.id) ? updatedGame : g
        );

        // 调用API更新后端数据
        await updateGames(token, updatedGames);

        setSuccess("Question deleted successfully");
        setShowSuccess(true);
      }
    } catch (error) {
      setError(
        "Failed to delete question: " + (error.message || "Unknown error")
      );
      setShowError(true);
    }
  };

  const handleNavigateToQuestion = (questionIndex) => {
    navigate(`/game/${game.id}/question/${questionIndex}`);
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-blue-400 via-blue-200 to-purple-200 min-h-screen flex justify-center items-center">
        <div className="text-blue-600 text-xl">Loading game data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-400 via-blue-200 to-purple-200 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">Edit Game</h1>

          <div className="flex space-x-2">
            <Button
              variant="secondary"
              className="bg-gray-600 text-white hover:bg-gray-700"
              onClick={handleBackToDashboard}
            >
              Back to Dashboard
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

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            Game Details
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <InputField
                label="Game Name"
                id="gameName"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Thumbnail Image
              </label>
              <div className="flex flex-col space-y-4">
                {imagePreview && (
                  <div className="mb-2">
                    <img
                      src={imagePreview}
                      alt="Thumbnail preview"
                      className="h-32 w-auto object-contain border rounded"
                    />
                  </div>
                )}

                <div className="flex space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <Button
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-100"
                    onClick={handleBrowseClick}
                  >
                    Browse...
                  </Button>

                  {imagePreview && (
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-100"
                      onClick={handleClearImage}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                <InputField
                  label="Or enter image URL"
                  id="thumbnail"
                  value={gameThumbnail}
                  onChange={(e) => {
                    setGameThumbnail(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="Enter thumbnail URL"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="primary"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleUpdateGame}
            >
              Save Game Details
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-800">Questions</h2>
            <Button
              variant="primary"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setOpenNewQuestionDialog(true)}
            >
              Add New Question
            </Button>
          </div>

          {questions.length === 0 ? (
            <p className="text-gray-600">
              No questions added yet. Add your first question!
            </p>
          ) : (
            <div className="space-y-4">
              {questions.map((questionFormat, index) => {
                // 使用工具函数提取问题对象
                const question = extractQuestionFromFormat(questionFormat);
                
                return (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {question?.text || `Question ${index + 1}`}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Type: {question?.type || "Single Choice"} | Time:{" "}
                          {question?.duration || question?.timeLimit || 30}s | Points:{" "}
                          {question?.points || 10}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="small"
                          className="text-blue-600 border-blue-600 hover:bg-blue-100"
                          onClick={() => handleNavigateToQuestion(index)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => handleDeleteQuestion(index)}
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
        </div>

        {openNewQuestionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">
                Add New Question
              </h2>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Question Type</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={newQuestionType}
                  onChange={(e) => setNewQuestionType(e.target.value)}
                >
                  <option value="single">Single Choice</option>
                  <option value="multiple">Multiple Choice</option>
                  <option value="judgement">Judgement</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="secondary"
                  className="bg-gray-600 text-white hover:bg-gray-700"
                  onClick={() => setOpenNewQuestionDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleAddQuestion}
                >
                  Create
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
    </div>
  );
};

export default EditGame;
