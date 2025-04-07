import axios from 'axios';

const API_BASE_URL = 'http://localhost:5005/admin';

/**
 * Fetch all games from the server.
 * @param {string} token 
 * @returns 
 */
export const getAllGames = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/games`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Fetch a specific game by its ID.
 * @param {string} token 
 * @param {integer} gameId 
 * @returns 
 */
export const updateGames = async (token, games) => {
  const response = await axios.put(`${API_BASE_URL}/games`, { games }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Fetch a specific game by its ID.
 * @param {string} token 
 * @param {integer} gameId 
 * @param {string} mutationType
 * @returns 
 */
export const mutateGameState = async (token, gameId, mutationType) => {
  const response = await axios.post(`${API_BASE_URL}/game/${gameId}/mutate`, { mutationType }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Fetch a specific game by its ID.
 * @param {string} token 
 * @param {integer} sessionId
 * @returns 
 */
export const getSessionStatus = async (token, sessionId) => {
  const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Fetch a specific game by its ID.
 * @param {string} token 
 * @param {integer} sessionId
 * @returns 
 */
export const getSessionResults = async (token, sessionId) => {
  const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/results`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
