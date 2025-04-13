import React from 'react';
import Button from '../../components/Button';

const GameQuestion = ({ question, selectedAnswers, onAnswerSelect, correctAnswers, gameState }) => {
  // 检查答案是否被选中
  const isAnswerSelected = (answer) => {
    if (question.type === 'judgement') {
      if (answer === true) {
        return selectedAnswers.includes("True/False");
      } else {
        return selectedAnswers.length === 0;
      }
    } else {
      return selectedAnswers.includes(answer);
    }
  };
  
  // 判断答案是否正确（用于显示回答后的结果）
  const isAnswerCorrect = (answer) => {
    if (!correctAnswers) return false;
    
    if (question.type === 'judgement') {
      if (answer === true) {
        return correctAnswers.includes("True/False");
      } else {
        return correctAnswers.length === 0;
      }
    } else {
      return correctAnswers.includes(answer);
    }
  };
  
  // 获取 YouTube 视频 ID
  const getYoutubeVideoId = (url) => {
    if (!url) return '';
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : '';
  };
  
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">{question.text}</h2>
        {question.duration && (
          <p className="text-gray-600">Time limit: {question.duration} seconds</p>
        )}
      </div>
      
      {/* 附件（图片或视频） */}
      {question.attachmentType === 'image' && question.attachmentUrl && (
        <div className="mb-6">
          <img 
            src={question.attachmentUrl} 
            alt="Question attachment" 
            className="max-w-full rounded-lg mx-auto"
          />
        </div>
      )}
      
      {question.attachmentType === 'youtube' && question.attachmentUrl && (
        <div className="mb-6">
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              src={`https://www.youtube.com/embed/${getYoutubeVideoId(question.attachmentUrl)}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-64 rounded-lg"
            ></iframe>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        {/* 判断题 */}
        {question.type === 'judgement' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              className={`p-4 text-lg bg-white primary`}
              onClick={() => gameState === 'active' && onAnswerSelect(true)}
              disabled={gameState !== 'active'}
            >
              True
            </Button>
            <Button
              className={`p-4 text-lg bg-white primary`}
              onClick={() => gameState === 'active' && onAnswerSelect(false)}
              disabled={gameState !== 'active'}
            >
              False
            </Button>
          </div>
        )}
        
        {/* 单选题和多选题 */}
        {(question.type === 'single' || question.type === 'multiple') && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.isArray(question.Answers) && question.Answers.map((answerObj, index) => {
              const answer = answerObj.Answer; // 使用新的 Answer 格式
              return (
                <Button
                  key={index}
                  variant='secondary'
                  className={`p-4 text-left`}
                  onClick={() => gameState === 'active' && onAnswerSelect(answer)}
                  disabled={gameState !== 'active'}
                >
                  {answer}
                </Button>
              );
            })}
          
          </div>
        )}
      </div>
      
      {/* 显示结果信息 */}
      {gameState === 'answered' && (
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">Answer Summary</h3>
          <p className="text-gray-700">
            {selectedAnswers && correctAnswers && 
             JSON.stringify(selectedAnswers.sort()) === JSON.stringify(correctAnswers.sort())
              ? '✅ Your answer is correct!'
              : '❌ Your answer is incorrect.'
            }
          </p>
          <div className="mt-2">
            <p className="font-medium text-gray-700">Correct answer(s):</p>
            {question.type === 'judgement' ? (
              <p>{correctAnswers && correctAnswers.includes("True/False") ? 'True' : 'False'}</p>
            ) : (
              <ul className="list-disc pl-5">
                {correctAnswers && correctAnswers.map((answer, index) => (
                  <li key={index}>{answer}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameQuestion;