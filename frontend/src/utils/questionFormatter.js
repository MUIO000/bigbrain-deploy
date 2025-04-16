/**
 * 工具函数集，用于处理问题数据的格式化、解析和转换
 */

/**
 * 格式化问题对象为后端接受的嵌套数组格式 [ [ [Object] ] ]
 * @param {Object} questionObj - 问题对象
 * @returns {Array} 嵌套格式的问题数组
 */
export const formatQuestionForBackend = (questionObj) => {
  // 确保问题对象是有效的
  if (!questionObj) return {};
  
  return  { ...questionObj } ;
};

/**
 * 从嵌套数组格式提取问题对象
 * @param {Array|Object} questionData - 可能是嵌套数组或对象的问题数据
 * @returns {Object} 提取的问题对象
 */
export const extractQuestionFromFormat = (questionData) => {
  // 处理空值
  if (!questionData) return null;
  
  // 已经是对象格式，直接返回
  if (!Array.isArray(questionData)) return questionData;
  
  // 处理嵌套数组格式 [ [ [Object] ] ]
  if (Array.isArray(questionData) && questionData.length > 0) {
    const firstLevel = questionData[0];
    
    // 处理 [ [Object] ] 格式
    if (Array.isArray(firstLevel) && firstLevel.length > 0) {
      const secondLevel = firstLevel[0];
      
      // 处理 [Object] 格式
      if (Array.isArray(secondLevel) && secondLevel.length > 0) {
        return secondLevel[0]; // 最深层的问题对象
      }
      
      return secondLevel; // 第二层的问题对象
    }
    
    return firstLevel; // 第一层可能是问题对象
  }
  
  // 返回原始数据，如果上面的条件都不满足
  return questionData;
};

/**
 * 准备问题对象用于保存，确保格式正确
 * @param {Object} questionObj - 原始问题对象
 * @param {Array} answers - 答案数组，包含 id, text, isCorrect 属性
 * @returns {Object} 格式化后的问题对象
 */
export const prepareQuestionForSave = (question, answers) => {
  // 处理判断题的特殊情况
  if (question.type === "judgement" || (answers.length === 1 && answers[0].text === "True/False")) {
    // 判断题的结果：如果"True/False"被标记为正确，则为True，否则为False
    const isTrue = answers.some(answer => answer.text === "True/False" && answer.isCorrect);
    return {
      correctAnswers: isTrue ? ["True/False"] : ["False"], // False显式存储为"False"而不是空数组
      answers: [{ text: "True/False" }] // 判断题始终只有一个答案选项
    };
  } else {
    // 非判断题的正常处理逻辑
    const correctAnswers = answers
      .filter(answer => answer.isCorrect)
      .map(answer => answer.text);
      
    return {
      correctAnswers,
      answers: answers.map(answer => ({ text: answer.text }))
    };
  }
};

/**
 * 准备用于显示的答案数组，从问题对象中提取
 * @param {Object} question - 问题对象
 * @returns {Array} 答案数组，包含 id, text, isCorrect 属性
 */
export const prepareAnswersForDisplay = (question) => {
  if (!question) return [];
  
  let answersWithCorrectFlag = [];
  
  // 处理使用新格式(Answers)的问题
  if (Array.isArray(question.Answers) && question.Answers.length > 0) {
    answersWithCorrectFlag = question.Answers.map((answerObj, index) => ({
      id: index + 1,
      text: answerObj.Answer || "",
      isCorrect: Array.isArray(question.correctAnswers) && 
                question.correctAnswers.includes(answerObj.Answer)
    }));
  } 
  // 处理使用旧格式(answers)的问题
  else if (Array.isArray(question.answers) && question.answers.length > 0) {
    answersWithCorrectFlag = question.answers.map((answer, index) => {
      // 转换旧格式的答案到新的内部格式
      const isCorrect = Array.isArray(question.correctAnswers) && 
                        question.correctAnswers.includes(answer.text);
      return {
        id: answer.id || index + 1,
        text: answer.text || "",
        isCorrect: isCorrect
      };
    });
  } 
  // 如果没有找到有效的答案，根据问题类型创建默认答案
  else {
    // 判断题默认只有一个答案选项
    if (question.type === "judgement") {
      answersWithCorrectFlag = [
        { id: 1, text: "True/False", isCorrect: false }
      ];
    } else {
      // 默认答案
      answersWithCorrectFlag = [
        { id: 1, text: "Answer 1", isCorrect: true },
        { id: 2, text: "Answer 2", isCorrect: false },
      ];
    }
  }
  
  return answersWithCorrectFlag;
};

/**
 * 创建新问题的默认对象
 * @param {string} questionType - 问题类型 (single, multiple, judgement)
 * @returns {Object} 默认问题对象
 */
export const createDefaultQuestion = (questionType = "single") => {
  // 默认答案
  let defaultAnswers;
  let correctAnswers;
  
  if (questionType === "judgement") {
    // 判断题默认只有一个答案选项
    defaultAnswers = [
      { Answer: "True/False" }
    ];
    correctAnswers = ["False"]; // 默认为False
  } else {
    // 其他类型的问题默认有两个选项
    defaultAnswers = [
      { Answer: "Answer 1" },
      { Answer: "Answer 2" }
    ];
    correctAnswers = ["Answer 1"]; // 默认第一个是正确答案
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
 * 更新问题列表中的问题
 * @param {Array} questions - 问题列表
 * @param {number} questionIndex - 要更新的问题索引
 * @param {Object} newQuestionObj - 更新后的问题对象
 * @returns {Array} 更新后的问题列表
 */
export const updateQuestionInList = (questions, questionIndex, newQuestionObj) => {
  const updatedQuestions = [...questions];
  // 确保索引有效
  if (updatedQuestions.length <= questionIndex) {
    for (let i = updatedQuestions.length; i <= questionIndex; i++) {
      updatedQuestions.push(formatQuestionForBackend({}));
    }
  }
  
  updatedQuestions[questionIndex] = formatQuestionForBackend(newQuestionObj);
  return updatedQuestions;
};