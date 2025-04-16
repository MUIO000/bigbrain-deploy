import { useState, useEffect, useRef } from 'react';

const WaitingScreen = ({ playerName }) => {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const lastBubbleTime = useRef(Date.now());
  const bubbleLifespan = 8000; // 泡泡存在时间(ms)

  // 生成随机泡泡
  const generateBubble = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const size = Math.random() * 60 + 40; // 40-100px size
    const x = Math.random() * (container.width - size);
    const y = container.height; // 从底部开始
    
    const speedX = (Math.random() - 0.5) * 1; // 随机水平速度
    const speedY = -Math.random() * 1 - 1; // 向上的垂直速度
    
    // 随机泡泡颜色 - 使用柔和的蓝色调
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

  // 更新泡泡位置
  const updateBubblePositions = () => {
    const now = Date.now();
    
    // 每隔一段时间生成新泡泡
    if (now - lastBubbleTime.current > 800) {
      setBubbles(prev => [...prev, generateBubble()]);
      lastBubbleTime.current = now;
    }
    
    setBubbles(prev => prev
      // 移动泡泡
      .map(bubble => ({
        ...bubble,
        x: bubble.x + bubble.speedX,
        y: bubble.y + bubble.speedY,
      }))
      // 移除超出生命周期或屏幕外的泡泡
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

  // 点击泡泡
  const popBubble = (id) => {
    setBubbles(prev => prev.filter(bubble => bubble.id !== id));
    setScore(prev => prev + 1);
    
    // 播放泡泡破裂音效
    const popSound = new Audio('/pop.mp3'); // 你需要添加这个音频文件
    popSound.volume = 0.2;
    popSound.play().catch(() => {}); // 忽略可能的自动播放限制错误
  };

  // 组件挂载和卸载时处理动画
  useEffect(() => {
    // 启动动画循环
    animationRef.current = requestAnimationFrame(updateBubblePositions);
    
    // 清理函数
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden relative">
      {/* 泡泡容器 */}
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
              transform: `scale(${1 + Math.sin(Date.now() / 1000) * 0.05})` // 轻微脉动效果
            }}
            onClick={() => popBubble(bubble.id)}
          />
        ))}
      </div>
      
      {/* 信息卡片 */}
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
      
      {/* 气泡小提示 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-70 px-4 py-2 rounded-full text-sm text-gray-700">
        Click on bubbles to pop them!
      </div>
    </div>
  );
};

export default WaitingScreen;