import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import ErrorPopup from "../../components/ErrorPopup";
import SuccessPopup from "../../components/SuccessPopup";
import { getAllGames, updateGames } from "../../api/gameApi";
import {
  extractQuestionFromFormat,
  prepareAnswersForDisplay,
  formatQuestionForBackend,
  createDefaultQuestion,
} from "../../utils/questionFormatter";
import { AuthContext } from "../../contexts/AuthContext";

const QuestionEditor = () => {
  const { gameId, questionId } = useParams();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  // State for game data
  const [, setAllGames] = useState([]);
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
          const foundGame = response.games.find((g) => g.id === numGameId);

          if (foundGame) {
            setCurrentGame(foundGame);

            // check if questionId is valid
            if (
              Array.isArray(foundGame.questions) &&
              foundGame.questions[numQuestionId]
            ) {
              // use the existing question
              const question = extractQuestionFromFormat(
                foundGame.questions[numQuestionId]
              );
              setCurrentQuestion(question);

              // set question text and type
              setQuestionText(question?.text || "");
              setQuestionType(question?.type || "single");

              // set time limit and points
              setTimeLimit(question?.duration || question?.timeLimit || 30);
              setPoints(question?.points || 10);

              // set answers
              const answersWithCorrectFlag = prepareAnswersForDisplay(question);
              setAnswers(answersWithCorrectFlag);

              // set attachment type and URL
              setAttachmentType(question?.attachmentType || "none");
              setAttachmentUrl(question?.attachmentUrl || "");
            } else {
              // create a new question if not found
              const newQuestion = createDefaultQuestion("single");

              setCurrentQuestion(newQuestion);
              setQuestionText(newQuestion.text);
              setAnswers(prepareAnswersForDisplay(newQuestion));
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
        setError(
          error.message || "An error occurred while loading question data"
        );
        setShowError(true);
        setLoading(false);
      }
    };

    fetchGameAndQuestion();
  }, [token, gameId, questionId, numGameId, numQuestionId]);

  // set default question type and answers when the component mounts
  useEffect(() => {
    if (questionType === "judgement") {
      const judgementAnswer = {
        id: 1,
        text: "True/False",
        isCorrect: false,
      };
      setAnswers([judgementAnswer]);
    } else if (answers.length < 2) {
      setAnswers([
        { id: 1, text: "Answer 1", isCorrect: true },
        { id: 2, text: "Answer 2", isCorrect: false },
      ]);
    }
  }, [questionType]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // save question function
  const handleSaveQuestion = async () => {
    try {
      if (!questionText.trim()) {
        setError("Question text is required");
        setShowError(true);
        return;
      }

      if (questionType === "judgement") {
        if (answers.length !== 1) {
          // reset answers to default for judgement question
          setAnswers([{ id: 1, text: "True/False", isCorrect: false }]);
        }
      } else {
        // other question types
        if (answers.length < 2) {
          setError(
            "At least 2 answers are required for non-judgement questions"
          );
          setShowError(true);
          return;
        }

        if (questionType === "single" && !answers.some((a) => a.isCorrect)) {
          setError("Single choice questions must have one correct answer");
          setShowError(true);
          return;
        }

        if (questionType === "multiple" && !answers.some((a) => a.isCorrect)) {
          setError(
            "Multiple choice questions must have at least one correct answer"
          );
          setShowError(true);
          return;
        }
      }

      // update question object
      const updatedQuestionObj = {
        id: currentQuestion?.id || Date.now(),
        text: questionText,
        type: questionType,
        duration: parseInt(timeLimit, 10), 
        points: parseInt(points, 10),
        attachmentType: attachmentType !== "none" ? attachmentType : "",
        attachmentUrl: attachmentUrl.trim() || "",
      };

      if (questionType === "judgement") {
        const isTrue = answers[0]?.isCorrect === true;
        updatedQuestionObj.answers = [{ text: "True/False" }];
        updatedQuestionObj.correctAnswers = isTrue ? ["True"] : ["False"]; // 显式存储False
      } else {
        updatedQuestionObj.answers = answers.map((answer) => ({
          text: answer.text,
        }));
        updatedQuestionObj.correctAnswers = answers
          .filter((answer) => answer.isCorrect)
          .map((answer) => answer.text);
      }

      // update question object for backend
      const formattedQuestion = formatQuestionForBackend(updatedQuestionObj);

      // update the current game object with the new question
      const updatedQuestions = [...(currentGame.questions || [])];
      if (updatedQuestions.length <= numQuestionId) {
        // fill the array with empty questions if needed
        for (let i = updatedQuestions.length; i <= numQuestionId; i++) {
          updatedQuestions.push(formatQuestionForBackend({}));
        }
      }
      updatedQuestions[numQuestionId] = formattedQuestion;

      // create a new game object with the updated questions
      const updatedGame = {
        ...currentGame, 
        questions: updatedQuestions, 
      };

      // update the game object in the backend
      const gamesData = await getAllGames(token);
      if (gamesData && Array.isArray(gamesData.games)) {
        const updatedGames = gamesData.games.map((game) =>
          String(game.id) === String(currentGame.id) ? updatedGame : game
        );

        await updateGames(token, updatedGames);

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

  // handle adding and deleting answers
  const handleAddAnswer = () => {
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

    const newId = Math.max(0, ...answers.map((a) => a.id)) + 1;
    const newAnswer = {
      id: newId,
      text: `Answer ${answers.length + 1}`,
      isCorrect: false,
    };
    setAnswers([...answers, newAnswer]);
  };

  // handle deleting answers
  const handleDeleteAnswer = (answerId) => {
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

    const updatedAnswers = answers.filter((a) => a.id !== answerId);
    setAnswers(updatedAnswers);
  };

  const handleAnswerTextChange = (answerId, text) => {
    const updatedAnswers = answers.map((a) =>
      a.id === answerId ? { ...a, text } : a
    );
    setAnswers(updatedAnswers);
  };

  // handle answer correctness change
  const handleAnswerCorrectChange = (answerId, isCorrect) => {
    let updatedAnswers = [...answers];

    if (questionType === "judgement") {
      updatedAnswers = updatedAnswers.map((a) =>
        a.id === answerId ? { ...a, isCorrect: !a.isCorrect } : a
      );
    } else if (questionType === "single" && isCorrect) {  
      updatedAnswers = updatedAnswers.map((a) =>
        a.id === answerId
          ? { ...a, isCorrect: true }
          : { ...a, isCorrect: false }
      );
    } else {
      updatedAnswers = updatedAnswers.map((a) =>
        a.id === answerId ? { ...a, isCorrect } : a
      );
    }

    setAnswers(updatedAnswers);
  };

  const handleBackToGame = () => {
    navigate(`/game/${gameId}`);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      setError("Please select an image file (JPEG, PNG, GIF, etc.)");
      setShowError(true);
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image size should be less than 2MB");
      setShowError(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target.result;
      setAttachmentUrl(base64Image);
      setSuccess("Image uploaded successfully");
      setShowSuccess(true);
    };

    reader.onerror = () => {
      setError("Failed to read the image file");
      setShowError(true);
    };

    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-blue-400 via-blue-200 to-purple-200 min-h-screen flex justify-center items-center">
        <div className="text-blue-600 text-xl">Loading question data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-400 via-blue-200 to-purple-200 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">
            Edit Question {parseInt(questionId, 10) + 1}
          </h1>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              className="bg-gray-600 text-white hover:bg-gray-700"
              onClick={handleBackToGame}
            >
              Back to Game
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
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">
              Question Details
            </h2>
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
              <label className="block text-gray-700 mb-2 -mt-1.5">
                Question Type
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
              >
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Choice</option>
                <option value="judgement">Judgement</option>
              </select>
            </div>
            <div>
              <InputField
                label="Time Limit (seconds)"
                id="timeLimit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                type="number"
                min="1"
                required
              />
            </div>
            <div>
              <InputField
                label="Points"
                id="points"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                type="number"
                min="1"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Attachment</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-gray-700 mb-2">
                  Attachment Type
                </label>
                <select
                  className="w-full p-2 border rounded-md "
                  value={attachmentType}
                  onChange={(e) => setAttachmentType(e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="youtube">YouTube Video</option>
                  <option value="image">Image</option>
                </select>
              </div>
              <div>
                {attachmentType !== "none" && (
                  <>
                    <InputField
                      label={
                        attachmentType === "youtube"
                          ? "YouTube URL"
                          : "Image URL"
                      }
                      id="attachmentUrl"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder={
                        attachmentType === "youtube"
                          ? "Enter YouTube video URL"
                          : "Enter image URL"
                      }
                    />
                    {attachmentType === "image" && (
                      <div className="mt-2">
                        <label
                          htmlFor="image-upload"
                          className="bg-blue-500 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-600 inline-block"
                        >
                          Upload Image
                        </label>
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        {attachmentUrl &&
                          attachmentUrl.startsWith("data:image") && (
                          <div className="mt-3">
                            <p className="text-green-600 text-sm">
                                Image uploaded successfully
                            </p>
                            <div className="mt-2 border p-2 rounded">
                              <img
                                src={attachmentUrl}
                                alt="Preview"
                                className="max-h-20 object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* change the title */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">
              {questionType === "judgement"
                ? "Judgement"
                : `Answers (${answers.length}/6)`}
            </h3>
            {questionType !== "judgement" && (
              <Button
                variant="primary"
                size="small"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleAddAnswer}
                disabled={answers.length >= 6}
              >
                Add Answer
              </Button>
            )}
          </div>

          {/* use map to render answers */}
          {answers.map((answer) => (
            <div
              key={answer.id}
              className="border rounded p-4 mb-3 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-start">
                <div className="flex-grow mr-4">
                  <InputField
                    label={
                      questionType === "judgement"
                        ? "True/False Statement"
                        : `Answer ${answer.id}`
                    }
                    id={`answer-${answer.id}`}
                    value={answer.text}
                    onChange={(e) =>
                      handleAnswerTextChange(answer.id, e.target.value)
                    }
                    placeholder={
                      questionType === "judgement"
                        ? "Enter true/false statement"
                        : "Enter answer text"
                    }
                    required
                    disabled={questionType === "judgement"} 
                  />
                </div>
                <div className="flex items-center mt-8 space-x-4">
                  <div className="flex items-center">
                    <input
                      type={
                        questionType === "judgement"
                          ? "checkbox"
                          : questionType === "multiple"
                            ? "checkbox"
                            : "radio"
                      }
                      id={`correct-${answer.id}`}
                      checked={answer.isCorrect}
                      onChange={(e) =>
                        handleAnswerCorrectChange(answer.id, e.target.checked)
                      }
                      className="mr-2"
                    />
                    <label htmlFor={`correct-${answer.id}`}>
                      {questionType === "judgement"
                        ? answer.isCorrect
                          ? "True"
                          : "False"
                        : "Correct"}
                    </label>
                  </div>
                  {questionType !== "judgement" && (
                    <Button
                      variant="danger"
                      size="small"
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => handleDeleteAnswer(answer.id)}
                      disabled={answers.length <= 2}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6">
            <Button
              variant="primary"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSaveQuestion}
            >
              Save Question
            </Button>
          </div>
        </div>

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

export default QuestionEditor;
