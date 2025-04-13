import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import EditGame from "../pages/GameEditor/EditGame";
import QuestionEditor from "../pages/GameEditor/QuestionEditor";
import SessionPage from "../pages/Session/SessionPage";
import PlayJoin from "../pages/Player/PlayJoin";
import PlayGame from "../pages/Player/PlayGame";
import GameResults from "../pages/Player/GameResults";

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/game/:gameId" element={<EditGame />} />
    <Route
      path="/game/:gameId/question/:questionId"
      element={<QuestionEditor />}
    />
    <Route path="/session/:sessionId" element={<SessionPage />} />
    <Route path="/play" element={<PlayJoin />} />
    <Route path="/play/:sessionId" element={<PlayJoin />} />
    <Route path="/play/game" element={<PlayGame />} />
    <Route path="/play/results" element={<GameResults />} />
  </Routes>
);

export default AppRouter;
