import axios from "axios";

const API_BASE_URL = "http://localhost:5005/play";

/**
 * Join a game session by session ID and player name.
 * @param {string} sessionId
 * @param {string} playerName
 */
export const joinGameSession = async (sessionId, playerName) => {
  const response = await axios.post(`${API_BASE_URL}/join/${sessionId}`, {
    name: playerName,
  });
  return response.data;
};

/**
 * Get current game session status.
 * @param {string} playerId
 */
export const getPlayerStatus = async (playerId) => {
  const response = await axios.get(`${API_BASE_URL}/${playerId}/status`);
  return response.data;
};

/**
 * Get current question for the player.
 * @param {string} playerId
 */
export const getPlayerQuestion = async (playerId) => {
  const response = await axios.get(`${API_BASE_URL}/${playerId}/question`);
  return response.data;
};

/**
 * Get answers for the current question after question ends.
 * @param {string} playerId
 */
export const getPlayerCorrectAnswer = async (playerId) => {
  const response = await axios.get(`${API_BASE_URL}/${playerId}/answer`);
  return response.data;
};

/**
 * Submit player's answer for the current question.
 * @param {string} playerId
 * @param {array} answerTexts 
 */
export const submitPlayerAnswer = async (playerId, answerTexts) => {
  const response = await axios.put(`${API_BASE_URL}/${playerId}/answer`, {
    answers: answerTexts 
  });
  return response.data;
};

/**
 * Get the results of the player after the game ends.
 * @param {string} playerId
 */
export const getPlayerResults = async (playerId) => {
  const response = await axios.get(`${API_BASE_URL}/${playerId}/results`);
  return response.data;
};
