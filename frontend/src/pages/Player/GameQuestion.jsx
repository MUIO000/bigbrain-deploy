import Button from "../../components/Button";

const GameQuestion = ({
  question,
  selectedAnswers,
  onAnswerSelect,
  onSubmit,
  correctAnswers,
  gameState,
}) => {
  // Get YouTube video ID
  const getYoutubeVideoId = (url) => {
    if (!url) return "";

    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return match && match[2].length === 11 ? match[2] : "";
  };
  
  // Get option button style
  const getButtonStyle = (answer) => {
    const isSelected = Array.isArray(selectedAnswers) && (
      answer === true 
        ? selectedAnswers.includes("True")
        : answer === false
          ? selectedAnswers.includes("False")
          : selectedAnswers.includes(answer)
    );
    
    // Common style
    const baseStyle = "w-full p-4 text-left rounded-md font-medium border-2 transition-all duration-200 focus:outline-none";
    
    // Return different styles based on selection and game state
    if (gameState !== "active") {
      return `${baseStyle} border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed`;
    }
    
    if (isSelected) {
      return `${baseStyle} border-green-500 bg-green-50 text-green-700 hover:bg-green-100`;
    } else {
      return `${baseStyle} border-gray-500 bg-white text-black-700 hover:bg-gray-100`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">
          {question.text}
        </h2>
        {question.points && (
          <p className="text-gray-600">
            Points: {question.points}
          </p>
        )}
      </div>

      {/* Attachment (image or video) */}
      {question.attachmentType === "image" && question.attachmentUrl && (
        <div className="mb-6">
          <img
            src={question.attachmentUrl}
            alt="Question attachment"
            className="max-w-full rounded-lg mx-auto"
          />
        </div>
      )}

      {question.attachmentType === "youtube" && question.attachmentUrl && (
        <div className="mb-6">
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              src={`https://www.youtube.com/embed/${getYoutubeVideoId(
                question.attachmentUrl
              )}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-64 rounded-lg"
            ></iframe>
          </div>
        </div>
      )}

      <div className="mt-6">
        {/* Judgement question */}
        {question.type === "judgement" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              className={getButtonStyle(true)}
              onClick={() => gameState === "active" && onAnswerSelect(true)}
              disabled={gameState !== "active"}
            >
              True
            </button>
            <button
              className={getButtonStyle(false)}
              onClick={() => gameState === "active" && onAnswerSelect(false)}
              disabled={gameState !== "active"}
            >
              False
            </button>
          </div>
        )}
        
        {/* Single and multiple choice questions */}
        {(question.type === "single" || question.type === "multiple") && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.isArray(question.answers) &&
              question.answers.map((answerObj, index) => {
                const answer = answerObj.text;
                return (
                  <button
                    key={index}
                    className={getButtonStyle(answer)}
                    onClick={() =>
                      gameState === "active" && onAnswerSelect(answer)
                    }
                    disabled={gameState !== "active"}
                  >
                    {answer}
                  </button>
                );
              })}
          </div>
        )}

        {/* Submit button (only for multiple choice) */}
        {gameState === "active" && (
          <div className="mt-4 text-center">
            <Button
              className="mt-4 bg-blue-700 text-white px-6 py-2 rounded-md"
              onClick={onSubmit}
              disabled={selectedAnswers.length === 0}
            >
              Submit Answers
            </Button>
          </div>
        )}
      </div>

      {/* Show result info */}
      {gameState === "answered" && (
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">
            Answer Summary
          </h3>
          <p className="text-gray-700">
            {selectedAnswers &&
            correctAnswers &&
            JSON.stringify(selectedAnswers.sort()) ===
              JSON.stringify(correctAnswers.sort())
              ? "✅ Your answer is correct!"
              : "❌ Your answer is incorrect."}
            <br />
            Your selected answer(s): 
            <ul className="list-disc pl-5">
              {selectedAnswers &&
                  selectedAnswers.map((answer, index) => (
                    <li key={index}>{answer}</li>
                  ))}
            </ul>
          </p>
          <div className="mt-2">
            <p className="font-medium text-gray-700">Correct answer(s):</p>
            {question.type === "judgement" ? (
              <p>
                {correctAnswers && correctAnswers.includes("True")
                  ? "True"
                  : correctAnswers && correctAnswers.includes("False")
                    ? "False"
                    : "Unknown"}
              </p>
            ) : (
              <ul className="list-disc pl-5 text-green-700">
                {correctAnswers &&
                  correctAnswers
                    .filter((answer) => answer !== "False")
                    .map((answer, index) => <li key={index}>{answer}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameQuestion;
