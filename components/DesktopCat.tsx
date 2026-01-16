import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { desktopCatState } from "@/state/fun";

const DesktopCat: React.FC = () => {
  const enabled = useRecoilValue(desktopCatState);
  const [position, setPosition] = useState({ x: 40, y: 40 });
  const [hearts, setHearts] = useState<Array<{
    id: number;
    dx: number;
    dy: number;
    rotation: number;
  }>>([]);

  // Simple heart burst on click, inspired by the compiled code you shared
  const spawnHearts = () => {
    const newHearts = Array.from({ length: 10 }).map((_, index) => ({
      id: Date.now() + index,
      dx: (Math.random() - 0.5) * 50,
      dy: (Math.random() - 0.5) * 50,
      rotation: Math.random() * 360,
    }));

    setHearts((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.some((n) => n.id === h.id)));
    }, 1000);
  };

  useEffect(() => {
    if (!enabled) return;

    let animationFrame: number | null = null;

    const handleMove = (event: MouseEvent) => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        setPosition({ x: event.clientX + 16, y: event.clientY + 16 });
      });
    };

    window.addEventListener("mousemove", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="fixed z-[100000] pointer-events-none transition-transform duration-75 ease-out"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div
        className="relative w-12 h-12 rounded-full bg-teal-500 shadow-lg flex items-center justify-center text-2xl cursor-pointer pointer-events-auto select-none"
        onClick={spawnHearts}
      >
        <span role="img" aria-label="Desktop cat">
          🐱
        </span>

        {hearts.map((heart) => (
          <span
            key={heart.id}
            className="absolute text-2xl text-teal-400 animate-[heartBurst_1s_ease-out_forwards] pointer-events-none"
            style={{
              left: `calc(50% + ${heart.dx}px)`,
              top: `calc(50% + ${heart.dy}px)`,
              transform: `translate(-50%, -50%) rotate(${heart.rotation}deg)`,
            }}
          >
            ❤️
          </span>
        ))}
      </div>
    </div>
  );
};

export default DesktopCat;
