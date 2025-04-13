import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResponseTimeChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-10">No response time data available</p>;
  }
  
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="questionNumber" 
            label={{ value: 'Question Number', position: 'insideBottom', offset: -5 }} 
          />
          <YAxis 
            label={{ value: 'Average Time (seconds)', angle: -90, position: 'insideLeft' }} 
          />
          <Tooltip formatter={(value) => [`${value}s`, 'Avg Response Time']} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="avgResponseTime" 
            name="Average Response Time" 
            stroke="#60a5fa" 
            strokeWidth={2}
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponseTimeChart;