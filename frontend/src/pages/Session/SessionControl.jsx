import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionStatus, mutateGameState } from "../../api/gameApi";
import Button from "../../components/Button";
import ErrorPopup from "../../components/ErrorPopup";
import SuccessPopup from "../../components/SuccessPopup";
import { AuthContext } from "../../contexts/AuthContext";
import { useContext } from "react";
import { extractQuestionFromFormat } from "../../utils/questionFormatter";
import StartSessionPopup from "../../components/StartSessionPopup";

const SessionControl = ({ sessionId, sessionData: initialData }) => {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(initialData);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSessionPopup, setShowSessionPopup] = useState(false);

  // Use ref to track polling state
  const pollingRef = useRef(true);
  const successTimeoutRef = useRef(null);

  const { logout } = useContext(AuthContext);
  const token = localStorage.getItem("token");

  // Get gameId from local storage
  const gameId = localStorage.getItem(`session_${sessionId}_gameId`);

  // Check if gameId exists
  useEffect(() => {
    if (!gameId) {
      setError("Game ID not found. Please return to dashboard and try again.");
      setShowError(true);
    }
  }, [gameId]);

  const handleCloseSessionPopup = () => {
    setShowSessionPopup(false);
  };

  // New: Return to Dashboard and Logout functions
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBackDashboard = () => {
    navigate("/dashboard");
  };

  // Cleanup polling and timers
  useEffect(() => {
    return () => {
      pollingRef.current = false;
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Periodically fetch session status updates
  useEffect(() => {
    const fetchStatus = async () => {
      if (!pollingRef.current) return;

      try {
        const data = await getSessionStatus(token, sessionId);
        console.log("Session data:", data);
        console.log("Position:", data.position);

        setSessionData(data.results || data);

        // If session is no longer active, reload the page to show results
        if (!data.active) {
          navigate(`/session/${sessionId}`);
          return;
        }

        // Calculate countdown (if the game has started)
        if (data.position >= 0 && data.isoTimeLastQuestionStarted) {
          // Extract question object, handle possible nested format
          const questionData = data.questions[data.position];
          const questionObject = extractQuestionFromFormat(questionData);

          const questionDuration = questionObject?.duration || 30;
          const startTime = new Date(data.isoTimeLastQuestionStarted);
          const endTime = new Date(
            startTime.getTime() + questionDuration * 1000
          );
          const now = new Date();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          setTimeRemaining(remaining);
        }
      } catch (err) {
        console.error("Error fetching session status:", err);
      }

      // Continue polling if the component is still mounted
      if (pollingRef.current) {
        setTimeout(fetchStatus, 1000);
      }
    };

    fetchStatus();

    return () => {
      pollingRef.current = false;
    };
  }, [token, sessionId, navigate]);

  // Handle "Next Question" button click
  const handleAdvance = async () => {
    if (!gameId) {
      setError("Game ID not found. Please return to dashboard and try again.");
      setShowError(true);
      return;
    }

    try {
      // Show processing state
      setSuccess("Processing...");
      setShowSuccess(true);

      // Call API to advance the game
      await mutateGameState(token, gameId, "ADVANCE");

      // Immediately fetch the latest status
      const updatedData = await getSessionStatus(token, sessionId);
      setSessionData(updatedData.results || updatedData);

      // Set success message based on the new position
      const newPosition = updatedData.position;
      if (newPosition === 0) {
        setSuccess("Game started successfully!");
      } else {
        setSuccess("Advanced to next question");
      }
      setShowSuccess(true);

      // Use ref to set auto-close timer
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }

      successTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
        successTimeoutRef.current = null;
      }, 3000);
    } catch (err) {
      console.error("Error advancing question:", err);
      setError(err.message || "Failed to advance question");
      setShowError(true);
    }
  };

  // Handle "End Session" button click
  const handleEndSession = async () => {
    if (!gameId) {
      setError("Game ID not found. Please return to dashboard and try again.");
      setShowError(true);
      return;
    }

    try {
      // Call API to end the game
      await mutateGameState(token, gameId, "END");
      setSuccess("Game session ended");
      setShowSuccess(true);

      // Stop polling
      pollingRef.current = false;

      // Navigate to results page
      setTimeout(() => {
        navigate(`/session/${sessionId}`);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to end session");
      setShowError(true);
    }
  };

  // Calculate progress information
  const position = sessionData.position;
  const totalQuestions = sessionData?.questions?.length || 0;

  // Get the current question, handle possible nested format
  let currentQuestion = null;
  if (position >= 0 && sessionData?.questions && position < totalQuestions) {
    currentQuestion = extractQuestionFromFormat(sessionData.questions[position]);
  }

  const isGameStarted = position >= 0;

  return (
    <div className="p-6 bg-gradient-to-br from-blue-400 via-blue-200 to-purple-200 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end space-x-2 mb-4">
          <Button
            variant="secondary"
            className="bg-gray-600 text-white hover:bg-gray-700"
            onClick={handleBackDashboard}
          >
            Dashboard
          </Button>
          <Button
            variant="secondary"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">Session Control</h1>
          <Button
            variant="danger"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleEndSession}
          >
            End Session
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-blue-800">
                {isGameStarted
                  ? `Question ${position + 1}/${totalQuestions}`
                  : "Game Ready"}
              </h2>
              <p className="text-sm text-gray-600">
                {isGameStarted
                  ? "Game in progress"
                  : 'Click "Start Game" to begin'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Players connected:</p>
              <p className="text-xl font-semibold text-blue-800">
                {Object.keys(sessionData?.players || {}).length}
              </p>
            </div>
          </div>

          {isGameStarted && currentQuestion && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">Current Question</h3>
                {timeRemaining !== null && (
                  <div
                    className={`px-4 py-1 rounded-full ${
                      timeRemaining > 10
                        ? "bg-green-100 text-green-800"
                        : timeRemaining > 5
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800 animate-pulse"
                    }`}
                  >
                    {timeRemaining}s remaining
                  </div>
                )}
              </div>

              <p className="text-lg mb-4">{currentQuestion.text}</p>

              {currentQuestion.attachmentType === "image" &&
                currentQuestion.attachmentUrl && (
                <div className="mb-4">
                  <img
                    src={currentQuestion.attachmentUrl}
                    alt="Question attachment"
                    className="max-w-full rounded-lg"
                  />
                </div>
              )}

              {currentQuestion.attachmentType === "youtube" &&
                currentQuestion.attachmentUrl && (
                <div className="mb-4">
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYoutubeVideoId(
                        currentQuestion.attachmentUrl
                      )}`}
                      title="YouTube video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg w-full h-64"
                    ></iframe>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-medium mb-2">Answer Options:</h4>
                {currentQuestion.type === "judgement" ? (
                  <div className="grid grid-cols-1 gap-2">
                    <div
                      className={`p-3 border rounded-lg ${
                        Array.isArray(currentQuestion.correctAnswers) &&
                        currentQuestion.correctAnswers.includes("True/False")
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                          ✓
                        </span>
                        <span>True</span>
                      </div>
                    </div>
                    <div
                      className={`p-3 border rounded-lg ${
                        !Array.isArray(currentQuestion.correctAnswers) ||
                        currentQuestion.correctAnswers.length === 0
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                          ✗
                        </span>
                        <span>False</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Answers in new format */}
                    {Array.isArray(currentQuestion.Answers) &&
                      currentQuestion.Answers.map((answerObj, i) => {
                        const answerText = answerObj.Answer;
                        return (
                          <div
                            key={i}
                            className={`p-3 border rounded-lg ${
                              Array.isArray(currentQuestion.correctAnswers) &&
                              currentQuestion.correctAnswers.includes(answerText)
                                ? "border-green-300 bg-green-50"
                                : "border-gray-300 bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                {i + 1}
                              </span>
                              <span>{answerText}</span>
                            </div>
                          </div>
                        );
                      })}
                    
                    {/* Answers in old format */}
                    {Array.isArray(currentQuestion.answers) && !Array.isArray(currentQuestion.Answers) &&
                      currentQuestion.answers.map((answer, i) => (
                        <div
                          key={i}
                          className={`p-3 border rounded-lg ${
                            Array.isArray(currentQuestion.correctAnswers) &&
                            currentQuestion.correctAnswers.includes(answer.text)
                              ? "border-green-300 bg-green-50"
                              : "border-gray-300 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                              {i + 1}
                            </span>
                            <span>{answer.text}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button
              variant="primary"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleAdvance}
            >
              {isGameStarted ? "Next Question" : "Start Game"}
            </Button>
            <Button
              variant="secondary"
              className="bg-gray-600 text-white hover:bg-gray-700 ml-4"
              onClick={() => setShowSessionPopup(true)}
            >
              Share Session Link
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-lg mb-3">Session Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Session ID:</p>
              <p className="font-mono">{sessionId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status:</p>
              <p
                className={isGameStarted ? "text-green-600" : "text-yellow-600"}
              >
                {isGameStarted ? "Active" : "Ready to start"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Game ID:</p>
              <p className="font-mono">{gameId || "Not available"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Question Type:</p>
              <p className="capitalize">
                {currentQuestion?.type || "Not started"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <StartSessionPopup
        sessionId={sessionId}
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

// Helper function to extract YouTube video ID from URL
function getYoutubeVideoId(url) {
  if (!url) return "";

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return match && match[2].length === 11 ? match[2] : "";
}

export default SessionControl;
