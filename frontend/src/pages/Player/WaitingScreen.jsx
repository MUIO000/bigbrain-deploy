import { useState, useEffect, useRef } from 'react';

const WaitingScreen = ({ playerName }) => {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const lastBubbleTime = useRef(Date.now());
  const bubbleLifespan = 8000; 

  // Generate a new bubble with random properties
  const generateBubble = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const size = Math.random() * 60 + 40; // 40-100px size
    const x = Math.random() * (container.width - size);
    const y = container.height; 
    
    const speedX = (Math.random() - 0.5) * 1; 
    const speedY = -Math.random() * 1 - 1; 
    
    const r = Math.floor(Math.random() * 50) + 150;
    const g = Math.floor(Math.random() * 50) + 150; 
    const b = Math.floor(Math.random() * 100) + 155;
    const opacity = Math.random() * 0.4 + 0.2; // 0.2-0.6

    return {
      id: Date.now().toString() + Math.random().toString(),
      x, 
      y,
      size,
      speedX,
      speedY,
      color: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      createdAt: Date.now()
    };
  };

  // Update bubble positions and remove old ones
  const updateBubblePositions = () => {
    const now = Date.now();
    
    if (now - lastBubbleTime.current > 800) {
      setBubbles(prev => [...prev, generateBubble()]);
      lastBubbleTime.current = now;
    }
    
    setBubbles(prev => prev
      .map(bubble => ({
        ...bubble,
        x: bubble.x + bubble.speedX,
        y: bubble.y + bubble.speedY,
      }))
      .filter(bubble => {
        const container = containerRef.current?.getBoundingClientRect();
        if (!container) return false;
        
        const isInLifespan = now - bubble.createdAt < bubbleLifespan;
        const isOnScreen = 
          bubble.x + bubble.size > 0 &&
          bubble.x < container.width &&
          bubble.y + bubble.size > 0 &&
          bubble.y < container.height;
        
        return isInLifespan && isOnScreen;
      })
    );
    
    animationRef.current = requestAnimationFrame(updateBubblePositions);
  };

  // Pop a bubble and update score
  const popBubble = (id) => {
    setBubbles(prev => prev.filter(bubble => bubble.id !== id));
    setScore(prev => prev + 1);
    
    const popSound = new Audio(''); 
    popSound.volume = 0.2;
    popSound.play().catch(() => {}); 
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateBubblePositions);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full bg-gradient-to-br from-blue-500 to-purple-600">
      <div 
        ref={containerRef}
        className="absolute inset-0 w-full h-full overflow-hidden"
      >
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="absolute rounded-full cursor-pointer transition-transform hover:scale-110"
            style={{
              left: `${bubble.x}px`,
              top: `${bubble.y}px`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              backgroundColor: bubble.color,
              boxShadow: `0 0 10px ${bubble.color}, 0 0 5px white inset`,
              transform: `scale(${1 + Math.sin(Date.now() / 1000) * 0.05})` 
            }}
            onClick={() => popBubble(bubble.id)}
          />
        ))}
      </div>
      
      <div className="z-10 bg-white bg-opacity-90 p-8 rounded-lg shadow-lg w-full max-w-md text-center backdrop-filter backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">Welcome, {playerName}</h1>
        <p className="text-lg text-gray-700 mb-4">
          Waiting for the quiz to start...
        </p>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-blue-700 font-semibold">
          Pop bubbles while you wait! Score: {score}
        </div>
      </div>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-70 px-4 py-2 rounded-full text-sm text-gray-700">
        Click on bubbles to pop them!
      </div>
    </div>
  );
};

export default WaitingScreen;