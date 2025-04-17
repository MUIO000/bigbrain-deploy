import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPlayerStatus,
  getPlayerQuestion,
  getPlayerCorrectAnswer,
  submitPlayerAnswer,
} from "../../api/player";
import ErrorPopup from "../../components/ErrorPopup";
import GameQuestion from "./GameQuestion";
import WaitingScreen from "./WaitingScreen";

const PlayerGame = () => {
  const navigate = useNavigate();
  const { playerId } = useParams();

  // Use playerId as part of the key to get the player's name
  const playerName =
    localStorage.getItem(`playerName_${playerId}`) || "Anonymous";

  // Component state
  const [question, setQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(null);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [lastQuestionId, setLastQuestionId] = useState(-1);
  const answerFetchingRef = useRef(false);

  // New: Score and stats state
  const [stats, setStats] = useState({
    score: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    questionsAnswered: 0,
    responseTimeTotal: 0,
  });

  // Refs
  const currentQuestionRef = useRef(null);
  const timerRef = useRef(null);
  const pollingRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const questionStartTimeRef = useRef(null);
  const lastQuestionIdRef = useRef(-1);

  // 1. Use useRef to track the latest game state
  const gameStateRef = useRef("waiting");

  // Modify useState initialization and add tracking logic
  const [gameState, setGameState] = useState(() => {
    // Try to restore game state from localStorage
    const savedState = localStorage.getItem(`gameState_${playerId}`);
    const initialState = savedState || "waiting";
    gameStateRef.current = initialState;
    return initialState;
  });

  // 2. Create a wrapper function to update game state, ensuring ref and localStorage are updated
  const updateGameState = (newState) => {
    console.log(`Updating game state: ${gameState} -> ${newState}`);
    // Update ref (sync)
    gameStateRef.current = newState;
    // Save to localStorage (sync)
    localStorage.setItem(`gameState_${playerId}`, newState);
    // Update React state (async)
    setGameState(newState);
  };

  // Poll game state
  useEffect(() => {
    if (!playerId) {
      navigate("/play");
      return;
    }

    // Try to restore stats from localStorage
    const savedStats = localStorage.getItem(`playerStats_${playerId}`);
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Failed to parse saved stats:", e);
      }
    }

    // Start polling game state
    startPolling();

    // Cleanup polling
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [playerId, navigate]);

  // Start polling game state
  const startPolling = () => {
    // Run once immediately
    checkGameStatus();

    // Set polling interval
    pollingRef.current = setInterval(() => {
      checkGameStatus();
    }, 2000); // Changed from 1000 to 2000ms
  };

  // Check game status
  const checkGameStatus = async () => {
    try {
      const statusData = await getPlayerStatus(playerId);
      console.log("Game status:", statusData);
      // Use ref to get the latest state instead of the state variable
      console.log("Current game state (ref):", gameStateRef.current);
      console.log("Current game state (state):", gameState);

      if (statusData.started) {
        // Use ref for comparison
        if (gameStateRef.current === "answered") {
          // If already answered, only check for new question
          const hasNewQuestion = await fetchCurrentQuestion();
          if (hasNewQuestion) {
            // Only set active state when there is a new question
            updateGameState("active");
            console.log("Game state updated to active due to answer");
            answerFetchingRef.current = false; // Reset flag
          }
        } else if (gameStateRef.current === "waiting") {
          // If waiting, check for question and set state
          const hasQuestion = await fetchCurrentQuestion();
          if (hasQuestion) {
            updateGameState("active");
            console.log("Game state updated to active");
          }
        } else if (gameStateRef.current === "active") {
          // If already active, update but do not reset state
          await fetchCurrentQuestion();
        }
      } else if (statusData.finished) {
        // Game finished, go to results page
        console.log("Game finished, navigating to results page");

        // Save final stats to localStorage
        savePlayerStats();

        // Navigate to results page
        navigate(`/play/results/${playerId}`);
      }
    } catch (error) {
      console.error("Error checking game status:", error);
      navigate(`/play/results/${playerId}`);
    }
  };

  // Fetch current question
  const fetchCurrentQuestion = async () => {
    try {
      console.log("Attempting to fetch current question...");
      const responseData = await getPlayerQuestion(playerId);
      if (responseData && responseData.question) {
        console.log("Question fetched successfully:", responseData.question);
        const questionData = responseData.question;
        // Use question ID as a unique identifier instead of a non-existent position
        const questionId = responseData.question.id || 0;
        setQuestion(questionData);

        // Get the question start time from the server
        const isoTimeLastQuestionStarted =
          responseData.question.isoTimeLastQuestionStarted;

        console.log("Question ID:", questionId);
        console.log("Last question ID:", lastQuestionIdRef.current);

        // Compare if it is a new question (using question ID)
        if (questionId !== lastQuestionIdRef.current) {
          lastQuestionIdRef.current = questionId;
          console.log("New question detected, ID:", questionId);
          currentQuestionRef.current = questionData;

          // Reset all state
          setQuestion(questionData);
          setSelectedAnswers([]);
          hasSubmittedRef.current = false;
          setCorrectAnswers(null);
          setLastQuestionId(questionId);

          // Clear existing timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Use server time to calculate remaining time and start timer
          if (questionData.duration && isoTimeLastQuestionStarted) {
            console.log(
              "Calculating remaining time using server time:",
              isoTimeLastQuestionStarted
            );
            startTimerBasedOnServerTime(
              isoTimeLastQuestionStarted,
              questionData.duration
            );
          }

          return true;
        } else if (currentQuestionRef.current) {
          // If it is the same question, only update remaining time (do not reset other state)
          setQuestion((prevQuestion) => {
            // If the question content changes (rare case), update the question
            if (JSON.stringify(prevQuestion) !== JSON.stringify(questionData)) {
              return questionData;
            }
            return prevQuestion; // Otherwise, keep it unchanged
          });

          if (questionData.duration && isoTimeLastQuestionStarted) {
            updateRemainingTime(
              isoTimeLastQuestionStarted,
              questionData.duration
            );
          }
        }
        return false;
      }
      return false;
    } catch (error) {
      console.error("Failed to fetch question:", error);
      if (error.response && error.response.status === 400) {
        console.log("Question unavailable, possibly game state changed");
      } else {
        setError("Failed to fetch question");
        setShowError(true);
      }
      return false;
    }
  };

  const startTimerBasedOnServerTime = (
    isoTimeLastQuestionStarted,
    duration
  ) => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Calculate current remaining time
    const serverStartTime = new Date(isoTimeLastQuestionStarted).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - serverStartTime) / 1000);
    const remainingSeconds = Math.max(0, duration - elapsedSeconds);

    console.log("Question started at:", new Date(serverStartTime).toLocaleTimeString());
    console.log("Current time:", new Date(currentTime).toLocaleTimeString());
    console.log("Elapsed seconds:", elapsedSeconds);
    console.log("Remaining seconds:", remainingSeconds);

    // Set remaining time
    setTimeRemaining(remainingSeconds);

    // Record question start time (use server time)
    questionStartTimeRef.current = new Date(serverStartTime);

    // If there is still time left, start the timer
    if (remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);

            // If there are selections but not submitted, auto-submit the current selection
            if (selectedAnswers.length > 0 && !hasSubmittedRef.current) {
              submitAnswer(selectedAnswers);
            }

            console.log("Time's up, fetching correct answers...");

            // Fetch correct answers - wait for the backend to set answerAvailable
            setTimeout(() => {
              fetchCorrectAnswers();
            }, 1500);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // If time is already up but the answer has not been fetched
      if (gameState === "active" && !correctAnswers) {
        console.log("Time's up, fetching correct answers...");

        // If there are selections but not submitted, auto-submit
        if (selectedAnswers.length > 0 && !hasSubmittedRef.current) {
          submitAnswer(selectedAnswers);
        }

        // Fetch correct answers
        setTimeout(() => {
          fetchCorrectAnswers();
        }, 1500);
      }
    }
  };

  // New: Update remaining time, but do not reset the timer
  const updateRemainingTime = (isoTimeLastQuestionStarted, duration) => {
    // Calculate current remaining time
    const serverStartTime = new Date(isoTimeLastQuestionStarted).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - serverStartTime) / 1000);
    const remainingSeconds = Math.max(0, duration - elapsedSeconds);
    // Check if time is up but the answer has not been fetched
    if (
      remainingSeconds <= 0 &&
      gameState === "active" &&
      !correctAnswers &&
      !hasSubmittedRef.current
    ) {
      console.log("Detected time's up while updating, fetching correct answers...");

      // If there are selections but not submitted, auto-submit
      if (selectedAnswers.length > 0) {
        submitAnswer(selectedAnswers);
      }
      return;
    }
    // If the calculated remaining time is inconsistent with the current display, update it
    setTimeRemaining((prevTime) => {
      if (Math.abs(prevTime - remainingSeconds) > 2) {
        // Allow 1-2 seconds of error
        console.log("Updating remaining time:", remainingSeconds);
        return remainingSeconds;
      }
      return prevTime;
    });
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    // If time is up, do not process the selection
    if (timeRemaining <= 0 || gameState !== "active") return;

    let newSelectedAnswers = [];

    if (question.type === "judgement") {
      // For judgement questions, toggle selection
      if (answer === true) {
        newSelectedAnswers = ["True"];
      } else {
        newSelectedAnswers = ["False"];
      }
      setSelectedAnswers(newSelectedAnswers);

      // Auto-submit for judgement questions
      submitAnswer(newSelectedAnswers);
    } else if (question.type === "single") {
      // For single choice questions, replace the previous selection
      newSelectedAnswers = [answer];
      setSelectedAnswers(newSelectedAnswers);

      // Auto-submit for single choice questions
      submitAnswer(newSelectedAnswers);
    } else if (question.type === "multiple") {
      // For multiple choice questions, toggle selection
      if (selectedAnswers.includes(answer)) {
        newSelectedAnswers = selectedAnswers.filter((a) => a !== answer);
      } else {
        newSelectedAnswers = [...selectedAnswers, answer];
      }
      setSelectedAnswers(newSelectedAnswers);
      // Multiple choice questions require manual submission by clicking the submit button
    }
  };

  // Submit answers to the server
  const submitAnswer = async (answers) => {
    try {
      console.log("Submitting answers:", answers);
      localStorage.setItem(
        `selectedAnswers_${playerId}_${lastQuestionId}`,
        JSON.stringify(answers)
      );

      await submitPlayerAnswer(playerId, answers);
      console.log("Answers submitted successfully");

      // Record the last submission time for calculating response time
      const answerTime = new Date();
      const responseTime = questionStartTimeRef.current
        ? (answerTime - questionStartTimeRef.current) / 1000
        : 0;

      // Temporarily store the response time for this question
      localStorage.setItem(
        `questionResponseTime_${playerId}_${lastQuestionId}`,
        responseTime.toString()
      );

      // Mark as submitted to prevent duplicate auto-submissions
      hasSubmittedRef.current = true;
    } catch (error) {
      console.error("Failed to submit answers:", error);
      setError("Failed to submit answers");
      setShowError(true);
    }
  };

  // Fetch correct answers
  const fetchCorrectAnswers = async () => {
    try {
      if (answerFetchingRef.current) return; // Prevent duplicate requests
      answerFetchingRef.current = true; // Set flag to prevent duplicate requests

      console.log("Fetching correct answers...");
      const answerData = await getPlayerCorrectAnswer(playerId);
      console.log("Correct answer data:", answerData);

      const responseData = await getPlayerQuestion(playerId);
      const questionId = responseData.question.id || 0;

      if (answerData && answerData.answers) {
        setCorrectAnswers(answerData.answers);
        // Use update function instead of direct setting
        updateGameState("answered");
        console.log("Game state updated to answered");

        let currentSelectedAnswers = [...selectedAnswers];
        // Try to get more accurate selections from localStorage
        try {
          console.log(localStorage);
          console.log("lastQuestionId:", lastQuestionId);
          console.log("QuestionId:", questionId);
          setLastQuestionId(questionId);
          const storedAnswers = localStorage.getItem(
            `selectedAnswers_${playerId}_${questionId}`
          );
          if (storedAnswers) {
            currentSelectedAnswers = JSON.parse(storedAnswers);
            console.log("Restored selections from localStorage:", currentSelectedAnswers);
          }
        } catch (e) {
          console.error("Failed to read selections from localStorage:", e);
        }

        // Calculate whether the answer is correct
        const isCorrect =
          currentSelectedAnswers &&
          currentSelectedAnswers.length > 0 &&
          JSON.stringify(currentSelectedAnswers.sort()) ===
            JSON.stringify(answerData.answers.sort());

        // Update stats
        updateStats(isCorrect, responseData.question.points);

        // Save stats to localStorage
        savePlayerStats();
      }
    } catch (error) {
      console.error("Failed to fetch correct answers:", error);
      setError("Failed to fetch correct answers");
      setShowError(true);
    }
  };

  // New: Update player stats
  const updateStats = (isCorrect, points) => {
    setStats((prevStats) => {
      // Calculate the score for this question (adjust scoring rules as needed)
      const questionScore = isCorrect ? points : 0;
      console.log("Question score:", questionScore);
      // Update stats
      const newStats = {
        score: prevStats.score + questionScore,
      };

      localStorage.setItem(
        `totalScore_${playerId}`,
        JSON.stringify(newStats.score)
      );
      console.log("-----------");
      console.log(localStorage);
      return newStats;
    });
  };

  // New: Save player stats to localStorage
  const savePlayerStats = () => {
    try {
      localStorage.setItem(`playerStats_${playerId}`, JSON.stringify(stats));
      console.log("Player stats saved:", stats);
    } catch (e) {
      console.error("Failed to save stats:", e);
    }
  };

  // Submit answers for multiple choice questions
  const handleSubmit = () => {
    if (selectedAnswers.length === 0 || gameState !== "active") return;
    submitAnswer(selectedAnswers);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-200 to-purple-200">
      {gameState === "waiting" && (
        <div>
          <WaitingScreen playerName={playerName} />
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        {gameState === "active" && question && (
          <div className="mb-4">
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <div className="flex justify-between items-center">
                {timeRemaining !== null && (
                  <div className="text-lg font-medium">
                    Time: {timeRemaining}s
                  </div>
                )}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000"
                    style={{
                      width: `${
                        (timeRemaining / (question.duration || 1)) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <GameQuestion
              question={question}
              selectedAnswers={selectedAnswers}
              onAnswerSelect={handleAnswerSelect}
              onSubmit={handleSubmit}
              gameState={gameState}
            />
          </div>
        )}

        {gameState === "answered" && question && (
          <div>
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-blue-800">
                  Question Results
                </h3>
                <div className="text-lg font-medium">
                  Score: +
                  {selectedAnswers &&
                  correctAnswers &&
                  JSON.stringify(selectedAnswers.sort()) ===
                    JSON.stringify(correctAnswers.sort())
                    ? question.points
                    : "0"}
                </div>
              </div>
            </div>

            <GameQuestion
              question={question}
              selectedAnswers={selectedAnswers}
              onAnswerSelect={handleAnswerSelect}
              onSubmit={handleSubmit}
              correctAnswers={correctAnswers}
              gameState={gameState}
            />

            <div className="mt-4 text-center">
              <p className="text-gray-600 mb-2">
                Waiting for the next question...
              </p>
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="mt-4 text-sm text-gray-600">
                Total score so far: {stats.score}
              </div>
            </div>
          </div>
        )}
      </div>

      <ErrorPopup
        message={error}
        show={showError}
        onClose={() => setShowError(false)}
      />
    </div>
  );
};

export default PlayerGame;
