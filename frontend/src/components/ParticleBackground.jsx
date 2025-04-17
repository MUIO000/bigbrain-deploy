import { useState, useEffect, useRef } from "react";

const ParticleBackground = ({ count = 24 }) => {
  const [particles, setParticles] = useState([]);
  const animationRef = useRef();

  // initial particles
  useEffect(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 2 + 2,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.3,
        color: `rgba(59,130,246,${Math.random() * 0.3 + 0.2})`, // blue-500
      });
    }
    setParticles(arr);
    // eslint-disable-next-line
  }, []);

  // animation loop
  useEffect(() => {
    const animate = () => {
      setParticles((prev) =>
        prev.map((p) => {
          let nx = p.x + p.dx;
          let ny = p.y + p.dy;
          if (nx < 0 || nx > window.innerWidth) p.dx *= -1;
          if (ny < 0 || ny > window.innerHeight) p.dy *= -1;
          return {
            ...p,
            x: Math.max(0, Math.min(window.innerWidth, nx)),
            y: Math.max(0, Math.min(window.innerHeight, ny)),
          };
        })
      );
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.r * 8,
            height: p.r * 8,
            background: p.color,
            opacity: p.opacity,
            filter: "blur(1.5px)",
            transition: "opacity 0.5s",
          }}
        />
      ))}
    </div>
  );
};

export default ParticleBackground;