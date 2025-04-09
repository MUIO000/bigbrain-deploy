import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import Dashboard from '../pages/Dashboard/Dashboard';
import EditGame from '../pages/GameEditor/EditGame';
import QuestionEditor from '../pages/GameEditor/QuestionEditor';

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/game/:gameId" element={<EditGame />} />
    <Route path="/game/:gameId/question/:questionId" element={<QuestionEditor />} />
  </Routes>
);

export default AppRouter;
