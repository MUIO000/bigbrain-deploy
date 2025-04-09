import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import ErrorPopup from "../../components/ErrorPopup";
import SuccessPopup from "../../components/SuccessPopup";
import { getAllGames, updateGames } from "../../api/gameApi";
import { AuthContext } from "../../contexts/AuthContext";
import { useContext } from "react";

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
            setGameThumbnail(foundGame.thumbnail || null);
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
    setImagePreview(null);
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
    } catch (error) {
      setError("Failed to update game");
      setShowError(true);
    }
  };

  const handleAddQuestion = async () => {
    try {
      const newQuestion = {
        id: Date.now(),
        text: "New Question",
        timeLimit: 30,
        points: 10,
        type: newQuestionType,
        answers: [
          { id: 1, text: "Answer 1", isCorrect: true },
          { id: 2, text: "Answer 2", isCorrect: false },
        ],
        attachmentType: null,
        attachmentUrl: null,
      };

      const updatedQuestions = [...questions, newQuestion];
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


