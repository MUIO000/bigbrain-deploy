import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import ErrorPopup from "../../components/ErrorPopup";
import SuccessPopup from "../../components/SuccessPopup"; 
import { getAllGames, updateGames } from "../../api/gameApi";

const QuestionEditor = () => {
  const { gameId, questionId } = useParams();
  const navigate = useNavigate();
  
  // State for game data
  const [allGames, setAllGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  
  // State for question form
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("single");
  const [timeLimit, setTimeLimit] = useState(30);
  const [points, setPoints] = useState(10);
  const [answers, setAnswers] = useState([]);
  const [attachmentType, setAttachmentType] = useState("none");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false); 

  const token = localStorage.getItem("token");
  const numQuestionId = parseInt(questionId, 10);
  const numGameId = parseInt(gameId, 10);

  useEffect(() => {
    const fetchGameAndQuestion = async () => {
      try {
        setLoading(true);
        const response = await getAllGames(token);
        
        if (response && Array.isArray(response.games)) {
          setAllGames(response.games);
          console.log("");
          console.log("numGameId:", numGameId);
          const foundGame = response.games.find(g => g.id === numGameId);
          
          if (foundGame) {
            setCurrentGame(foundGame);
            
            // Check if questions array exists and has the requested question
            if (Array.isArray(foundGame.questions) && foundGame.questions[numQuestionId]) {
              const question = foundGame.questions[numQuestionId];
              setCurrentQuestion(question);
              
              // Set form values from question data
              setQuestionText(question.text || "");
              setQuestionType(question.type || "single");
              setTimeLimit(question.timeLimit || 30);
              setPoints(question.points || 10);
              
              // Set answers
              if (Array.isArray(question.answers) && question.answers.length > 0) {
                setAnswers(question.answers);
              } else {
                // Default answers
                setAnswers([
                  { id: 1, text: "Answer 1", isCorrect: true },
                  { id: 2, text: "Answer 2", isCorrect: false },
                ]);
              }
              
              // Set attachment data
              setAttachmentType(question.attachmentType || "none");
              setAttachmentUrl(question.attachmentUrl || "");
            } else {
              // Create a new question if it doesn't exist
              const newQuestion = {
                id: Date.now(),
                text: "New Question",
                type: "single",
                timeLimit: 30,
                points: 10,
                answers: [
                  { id: 1, text: "Answer 1", isCorrect: true },
                  { id: 2, text: "Answer 2", isCorrect: false },
                ],
                attachmentType: "none",
                attachmentUrl: "",
              };
              
              setCurrentQuestion(newQuestion);
              setQuestionText(newQuestion.text);
              setAnswers(newQuestion.answers);
            }
          } else {
            throw new Error("Game not found");
          }
        } else {
          throw new Error("Failed to load games data");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message || "An error occurred while loading question data");
        setShowError(true);
        setLoading(false);
      }
    };

    fetchGameAndQuestion();
  }, [token, gameId, questionId, numGameId, numQuestionId]);

  // 添加一个 useEffect 来监听问题类型变化
  useEffect(() => {
    // 当问题类型改变为判断题时
    if (questionType === "judgement") {
      // 判断题只需要一个答案
      const judgementAnswer = {
        id: 1,
        text: "True/False",
        isCorrect: false
      };
      setAnswers([judgementAnswer]);
    } else if (answers.length < 2) {
      // 如果从判断题切换回其他类型，确保至少有两个答案选项
      setAnswers([
        { id: 1, text: "Answer 1", isCorrect: true },
        { id: 2, text: "Answer 2", isCorrect: false },
      ]);
    }
  }, [questionType]);

  // 修改 handleSaveQuestion 函数，为判断题添加特殊验证
  const handleSaveQuestion = async () => {
    try {
      // 验证输入
      if (!questionText.trim()) {
        setError("Question text is required");
        setShowError(true);
        return;
      }

      // 判断题的特殊验证逻辑
      if (questionType === "judgement") {
        if (answers.length !== 1) {
          // 重置为一个答案
          setAnswers([{ id: 1, text: "True/False", isCorrect: false }]);
        }
      } else {
        // 非判断题的常规验证
        if (answers.length < 2) {
          setError("At least 2 answers are required for non-judgement questions");
          setShowError(true);
          return;
        }

        if (questionType === "single" && !answers.some(a => a.isCorrect)) {
          setError("Single choice questions must have one correct answer");
          setShowError(true);
          return;
        }

        if (questionType === "multiple" && !answers.some(a => a.isCorrect)) {
          setError("Multiple choice questions must have at least one correct answer");
          setShowError(true);
          return;
        }
      }

      // 创建更新后的问题对象
      const updatedQuestion = {
        id: currentQuestion?.id || Date.now(),
        text: questionText,
        type: questionType,
        timeLimit: parseInt(timeLimit, 10),
        points: parseInt(points, 10),
        answers: answers,
        attachmentType: attachmentType !== "none" ? attachmentType : null,
        attachmentUrl: attachmentUrl.trim() || null,
      };

      // 更新游戏中的问题
      const updatedQuestions = [...(currentGame.questions || [])];
      if (updatedQuestions.length <= numQuestionId) {
        // 如果需要，添加空的问题
        for (let i = updatedQuestions.length; i <= numQuestionId; i++) {
          updatedQuestions.push({});
        }
      }
      updatedQuestions[numQuestionId] = updatedQuestion;

      // 创建更新后的游戏对象，保留所有字段
      const updatedGame = {
        ...currentGame, // 保留所有原始字段
        questions: updatedQuestions, // 更新问题列表
      };

      // 获取最新的游戏列表
      const gamesData = await getAllGames(token);
      if (gamesData && Array.isArray(gamesData.games)) {
        // 使用完整的游戏对象更新
        const updatedGames = gamesData.games.map(game =>
          String(game.id) === String(currentGame.id) ? updatedGame : game
        );

        // 调用 API 更新后端数据
        await updateGames(token, updatedGames);

        // 重新获取最新的游戏数据
        const refreshedData = await getAllGames(token);
        if (refreshedData && refreshedData.games) {
          setAllGames(refreshedData.games);
          const refreshedGame = refreshedData.games.find(g => g.id === numGameId);
          if (refreshedGame) {
            setCurrentGame(refreshedGame);
            if (refreshedGame.questions && refreshedGame.questions[numQuestionId]) {
              setCurrentQuestion(refreshedGame.questions[numQuestionId]);
            }
          }
        }

        setSuccess("Question saved successfully");
        setShowSuccess(true);
      } else {
        throw new Error("Failed to update game");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      setError(error.message || "Failed to save question");
      setShowError(true);
    }
  };

  // 修改 handleAddAnswer 和 handleDeleteAnswer 函数
  const handleAddAnswer = () => {
    // 判断题不允许添加更多答案
    if (questionType === "judgement") {
      setError("Judgement questions can only have one answer");
      setShowError(true);
      return;
    }

    if (answers.length >= 6) {
      setError("Maximum of 6 answers allowed");
      setShowError(true);
      return;
    }

    const newId = Math.max(0, ...answers.map(a => a.id)) + 1;
    const newAnswer = { 
      id: newId, 
      text: `Answer ${answers.length + 1}`, 
      isCorrect: false 
    };
    setAnswers([...answers, newAnswer]);
  };

  const handleDeleteAnswer = (answerId) => {
    // 判断题不允许删除答案
    if (questionType === "judgement") {
      setError("Judgement questions must have exactly one answer");
      setShowError(true);
      return;
    }

    if (answers.length <= 2) {
      setError("Minimum of 2 answers required");
      setShowError(true);
      return;
    }

    const updatedAnswers = answers.filter(a => a.id !== answerId);
    setAnswers(updatedAnswers);
  };

  const handleAnswerTextChange = (answerId, text) => {
    const updatedAnswers = answers.map(a =>
      a.id === answerId ? { ...a, text } : a
    );
    setAnswers(updatedAnswers);
  };

  // 修改 handleAnswerCorrectChange 函数，使判断题可以切换正确性
  const handleAnswerCorrectChange = (answerId, isCorrect) => {
    let updatedAnswers = [...answers];
    
    if (questionType === "judgement") {
      // 判断题可以切换答案的正确性（反转当前状态）
      updatedAnswers = updatedAnswers.map(a =>
        a.id === answerId ? { ...a, isCorrect: !a.isCorrect } : a
      );
    } else if (questionType === "single" && isCorrect) {
      // 单选题逻辑保持不变
      updatedAnswers = updatedAnswers.map(a =>
        a.id === answerId ? { ...a, isCorrect: true } : { ...a, isCorrect: false }
      );
    } else {
      // 多选题逻辑保持不变
      updatedAnswers = updatedAnswers.map(a =>
        a.id === answerId ? { ...a, isCorrect } : a
      );
    }
    
    setAnswers(updatedAnswers);
  };

  const handleBackToGame = () => {
    navigate(`/game/${gameId}`);
  };

  if (loading) {
    return <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen flex justify-center items-center">
      <div className="text-blue-600 text-xl">Loading question data...</div>
    </div>;
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-800">
          Edit Question {parseInt(questionId, 10) + 1}
        </h1>
        <Button
          variant="secondary"
          className="bg-gray-600 text-white hover:bg-gray-700"
          onClick={handleBackToGame}
        >
          Back to Game
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Question Details</h2>
          <InputField
            label="Question Text"
            id="questionText"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter question text"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
          <div>
            <label className="block text-gray-700 mb-2 -mt-1.5">Question Type</label>
            <select
              className="w-full p-2 border rounded-md"
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
            >

  );
};

export default QuestionEditor;