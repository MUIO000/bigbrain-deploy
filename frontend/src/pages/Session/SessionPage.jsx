import { useState, useEffect } from 'react';
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
  
  // load session data when component mounts or sessionId changes
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
    const interval = setInterval(fetchSessionData, 2000);
    
    return () => clearInterval(interval);
  }, [sessionId, token]);
  
  if (loading) {
    return <LoadingSpinner message="Loading session..." />;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  // display session control or results based on session status
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