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

  );
};

export default QuestionEditor;