import React, { useState, useEffect } from 'react';
import Button from './Button';

const PlayerQuestion = ({ question, onAnswerSubmit, timeRemaining }) => {
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  // 重置组件状态当接收到新问题时
  useEffect(() => {
    setSelectedAnswers([]);
    setSubmitted(false);
  }, [question?.id]);
  
  // 处理答案选择
  const handleAnswerSelect = (answerId) => {
    if (submitted) return; // 如果已提交，不能再修改
    
    if (question.type === 'judgement') {
      // 判断题: True (1) 或 False (空数组)
      if (answerId === 1) {
        setSelectedAnswers([1]); // True
      } else {
        setSelectedAnswers([]); // False
      }
    } else if (question.type === 'single') {
      // 单选题只能选择一个答案
      setSelectedAnswers([answerId]);
    } else {
      // 多选题可以选择多个答案
      if (selectedAnswers.includes(answerId)) {
        setSelectedAnswers(selectedAnswers.filter(id => id !== answerId));
      } else {
        setSelectedAnswers([...selectedAnswers, answerId]);
      }
    }
  };
  
  // 提交答案
  const handleSubmit = () => {
    if (submitted) return;
    
    // 对于判断题，仅当选择True时才提交[1]，选择False时提交空数组
    if (question.type === 'judgement') {
      onAnswerSubmit(selectedAnswers); // 已在handleAnswerSelect中处理
    } else {
      onAnswerSubmit(selectedAnswers);
    }
    setSubmitted(true);
  };

  if (!question) return <div className="text-center py-8">Waiting for question...</div>;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-blue-800">{question.text}</h2>
        {timeRemaining !== null && (
          <div className={`px-4 py-1 rounded-full ${
            timeRemaining > 10 ? 'bg-green-100 text-green-800' : 
            timeRemaining > 5 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800 animate-pulse'
          }`}>
            {timeRemaining}s
          </div>
        )}
      </div>
      
      {/* 显示附件（图片或视频） */}
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
        <div className="mb-6 aspect-w-16 aspect-h-9">
          <iframe
            src={`https://www.youtube.com/embed/${getYoutubeVideoId(question.attachmentUrl)}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-64 rounded-lg"
          ></iframe>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Select your answer:</h3>
        
        {/* 判断题 */}
        {question.type === 'judgement' ? (
          <div className="grid grid-cols-1 gap-3">
            <div 
              className={`p-4 border rounded-lg cursor-pointer ${
                selectedAnswers.includes(1) ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleAnswerSelect(1)}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${
                  selectedAnswers.includes(1) ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}>
                  ✓
                </div>
                <span>True</span>
              </div>
            </div>
            <div 
              className={`p-4 border rounded-lg cursor-pointer ${
                Array.isArray(selectedAnswers) && selectedAnswers.length === 0 && submitted ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleAnswerSelect(0)} // Use 0 as identifier for False
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${
                  Array.isArray(selectedAnswers) && selectedAnswers.length === 0 && submitted ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}>
                  ✗
                </div>
                <span>False</span>
              </div>
            </div>
          </div>
        ) : (
          /* 单选题和多选题 */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.Answers && question.Answers.map((answer, index) => (
              <div 
                key={index}
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedAnswers.includes(index + 1) ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleAnswerSelect(index + 1)}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${
                    selectedAnswers.includes(index + 1) ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}>
                    {index + 1}
                  </div>
                  <span>{answer.Answer}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="text-center">
        <Button
          variant="primary"
          className={`${
            submitted 
            ? 'bg-gray-500 cursor-not-allowed' 
            : (question.type === 'judgement' || selectedAnswers.length > 0)
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-400 cursor-not-allowed'
          } text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200`}
          onClick={handleSubmit}
          disabled={submitted || (question.type !== 'judgement' && selectedAnswers.length === 0)}
        >
          {submitted ? 'Submitted' : 'Submit Answer'}
        </Button>
      </div>
    </div>
  );
};

// 辅助函数：从YouTube URL中提取视频ID
function getYoutubeVideoId(url) {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}

export default PlayerQuestion;