import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSessionStatus } from '../../api/gameApi';
import SessionControl from './SessionControl';
import SessionResults from './SessionResults';
import LoadingSpinner from '../../components/LoadingSpinner';

const SessionPage = () => {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const token = localStorage.getItem('token');
  
  // 加载会话数据
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const data = await getSessionStatus(token, sessionId);
        setSessionData(data.results);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load session data');
        setLoading(false);
      }
    };
    
    fetchSessionData();
    // 设置轮询，定期检查会话状态
    const interval = setInterval(fetchSessionData, 5000);
    
    return () => clearInterval(interval);
  }, [sessionId, token]);
  
  if (loading) {
    return <LoadingSpinner message="Loading session..." />;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  // 根据会话状态决定显示哪个组件
  return sessionData.active ? (
    <SessionControl 
      sessionData={sessionData} 
      sessionId={sessionId} 
    />
  ) : (
    <SessionResults 
      sessionId={sessionId} 
    />
  );
};

export default SessionPage;