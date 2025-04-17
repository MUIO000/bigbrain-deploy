/**
 * Utility functions for formatting, parsing, and transforming question data
 */

/**
 * Format a question object into the nested array format [ [ [Object] ] ] accepted by the backend
 * @param {Object} questionObj - The question object
 * @returns {Array} The formatted nested question array
 */
export const formatQuestionForBackend = (questionObj) => {
  // Ensure the question object is valid
  if (!questionObj) return {};

  return { ...questionObj };
};

/**
 * Extract a question object from a nested array format
 * @param {Array|Object} questionData - The question data, which could be a nested array or an object
 * @returns {Object} The extracted question object
 */
export const extractQuestionFromFormat = (questionData) => {
  // Handle null or undefined values
  if (!questionData) return null;

  // If it's already an object, return it directly
  if (!Array.isArray(questionData)) return questionData;

  // Handle nested array format [ [ [Object] ] ]
  if (Array.isArray(questionData) && questionData.length > 0) {
    const firstLevel = questionData[0];

    // Handle [ [Object] ] format
    if (Array.isArray(firstLevel) && firstLevel.length > 0) {
      const secondLevel = firstLevel[0];

      // Handle [Object] format
      if (Array.isArray(secondLevel) && secondLevel.length > 0) {
        return secondLevel[0]; // The deepest question object
      }

      return secondLevel; // The second-level question object
    }

    return firstLevel; // The first-level question object
  }

  // Return the original data if none of the above conditions are met
  return questionData;
};

/**
 * Prepare a question object for saving, ensuring the format is correct
 * @param {Object} questionObj - The original question object
 * @param {Array} answers - The array of answers, containing id, text, and isCorrect properties
 * @returns {Object} The formatted question object
 */
export const prepareQuestionForSave = (question, answers) => {
  // Handle special cases for judgement questions
  if (
    question.type === "judgement" ||
    (answers.length === 1 && answers[0].text === "True/False")
  ) {
    // Judgement question result: If "True/False" is marked as correct, it's True; otherwise, it's False
    const isTrue = answers.some(
      (answer) => answer.text === "True/False" && answer.isCorrect
    );
    return {
      correctAnswers: isTrue ? ["True/False"] : ["False"], // Explicitly store False as "False" instead of an empty array
      answers: [{ text: "True/False" }], // Judgement questions always have one answer option
    };
  } else {
    // Normal processing logic for non-judgement questions
    const correctAnswers = answers
      .filter((answer) => answer.isCorrect)
      .map((answer) => answer.text);

    return {
      correctAnswers,
      answers: answers.map((answer) => ({ text: answer.text })),
    };
  }
};

/**
 * Prepare an array of answers for display, extracted from a question object
 * @param {Object} question - The question object
 * @returns {Array} An array of answers, containing id, text, and isCorrect properties
 */
export const prepareAnswersForDisplay = (question) => {
  if (!question) return [];

  let answersWithCorrectFlag = [];

  // Handle questions using the new format (Answers)
  if (Array.isArray(question.Answers) && question.Answers.length > 0) {
    answersWithCorrectFlag = question.Answers.map((answerObj, index) => ({
      id: index + 1,
      text: answerObj.Answer || "",
      isCorrect:
        Array.isArray(question.correctAnswers) &&
        question.correctAnswers.includes(answerObj.Answer),
    }));
  }
  // Handle questions using the old format (answers)
  else if (Array.isArray(question.answers) && question.answers.length > 0) {
    answersWithCorrectFlag = question.answers.map((answer, index) => {
      // Convert old format answers to the new internal format
      const isCorrect =
        Array.isArray(question.correctAnswers) &&
        question.correctAnswers.includes(answer.text);
      return {
        id: answer.id || index + 1,
        text: answer.text || "",
        isCorrect: isCorrect,
      };
    });
  }
  // If no valid answers are found, create default answers based on the question type
  else {
    // Judgement questions always have one answer option
    if (question.type === "judgement") {
      answersWithCorrectFlag = [
        { id: 1, text: "True/False", isCorrect: false },
      ];
    } else {
      // Default answers
      answersWithCorrectFlag = [
        { id: 1, text: "Answer 1", isCorrect: true },
        { id: 2, text: "Answer 2", isCorrect: false },
      ];
    }
  }

  return answersWithCorrectFlag;
};

/**
 * Create a default question object for a new question
 * @param {string} questionType - The question type (single, multiple, judgement)
 * @returns {Object} The default question object
 */
export const createDefaultQuestion = (questionType = "single") => {
  // Default answers
  let defaultAnswers;
  let correctAnswers;

  if (questionType === "judgement") {
    // Judgement questions always have one answer option
    defaultAnswers = [{ Answer: "True/False" }];
    correctAnswers = ["False"]; // Default to False
  } else {
    // Other question types have two options by default
    defaultAnswers = [
      { Answer: "Answer 1" },
      { Answer: "Answer 2" },
    ];
    correctAnswers = ["Answer 1"]; // Default the first answer as correct
  }

  return {
    id: Date.now(),
    text: "New Question",
    duration: 30,
    points: 10,
    type: questionType,
    correctAnswers: correctAnswers,
    Answers: defaultAnswers,
    attachmentType: "",
    attachmentUrl: "",
  };
};

/**
 * Update a question in the question list
 * @param {Array} questions - The list of questions
 * @param {number} questionIndex - The index of the question to update
 * @param {Object} newQuestionObj - The updated question object
 * @returns {Array} The updated list of questions
 */
export const updateQuestionInList = (questions, questionIndex, newQuestionObj) => {
  const updatedQuestions = [...questions];
  // Ensure the index is valid
  if (updatedQuestions.length <= questionIndex) {
    for (let i = updatedQuestions.length; i <= questionIndex; i++) {
      updatedQuestions.push(formatQuestionForBackend({}));
    }
  }

  updatedQuestions[questionIndex] = formatQuestionForBackend(newQuestionObj);
  return updatedQuestions;
};