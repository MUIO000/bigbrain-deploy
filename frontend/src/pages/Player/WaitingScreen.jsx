const WaitingScreen = ({ playerName }) => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-blue-800 mb-4">Welcome, {playerName}</h1>
        <p className="text-lg text-gray-700 mb-6">
          Please wait for the game to start...
        </p>
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

export default WaitingScreen;