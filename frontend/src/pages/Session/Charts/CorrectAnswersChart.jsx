import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CorrectAnswersChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-10">No question data available</p>;
  }
  
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="questionNumber" 
            label={{ value: 'Question Number', position: 'insideBottom', offset: -5 }} 
          />
          <YAxis 
            label={{ value: 'Correct Answers (%)', angle: -90, position: 'insideLeft' }} 
          />
          <Tooltip formatter={(value) => [`${value}%`, 'Correct Answers']} />
          <Legend />
          <Bar 
            dataKey="correctPercentage" 
            name="Correct Percentage" 
            fill="#4ade80" 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CorrectAnswersChart;