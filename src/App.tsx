import { useEffect, useRef, useState } from 'react';
import { Game } from './core/Game';
import { GameUI } from './ui/GameUI';
import { AchievementToast } from './ui/AchievementToast';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const gameInstance = new Game(canvasRef.current, containerRef.current);
    gameInstance.init();
    setGame(gameInstance);

    return () => {
      gameInstance.destroy();
    };
  }, []);

  return (
    <main className="h-full w-full flex items-center justify-center bg-[#090A0C] overflow-hidden select-none">
      <OfflineIndicator />
      <AchievementToast />

      {/* Centered responsive mobile/arcade viewport frame */}
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[460px] max-h-[880px] bg-[#121316] shadow-2xl overflow-hidden flex flex-col"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-pointer"
        />

        <GameUI game={game} />
      </div>
    </main>
  );
}
