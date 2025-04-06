import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, DEFAULT_CONFIG } from '../lib/gameEngine';
import { AIDifficulty, Ball, Brick, BrickType, GameEvent, PowerUp, PowerUpType } from '../lib/types';

interface GameProps {
  difficulty: AIDifficulty;
  onGameOver: (playerScore: number, aiScore: number, playerLives: number, playTime: number) => void;
}

const Game: React.FC<GameProps> = ({ difficulty, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [playerLives, setPlayerLives] = useState(DEFAULT_CONFIG.initialLives);
  const [aiLives, setAiLives] = useState(DEFAULT_CONFIG.initialLives);
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_CONFIG.gameDuration);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize game engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = DEFAULT_CONFIG.width;
    canvas.height = DEFAULT_CONFIG.height;

    // Create game engine
    const gameEngine = new GameEngine({
      aiDifficulty: difficulty,
    });

    // Handle game events
    gameEngine.onEvent((event: GameEvent) => {
      switch (event.type) {
        case 'score':
          if (event.player === 'human') {
            setPlayerScore(event.value || 0);
          } else {
            setAiScore(event.value || 0);
          }
          break;
        case 'life_lost':
          if (event.player === 'human') {
            setPlayerLives(event.value || 0);
          } else {
            setAiLives(event.value || 0);
          }
          break;
        case 'time_update':
          setTimeRemaining(event.value || 0);
          break;
        case 'game_over':
          setIsGameOver(true);
          gameEngine.stop();
          onGameOver(
            gameEngine.getState().playerScore,
            gameEngine.getState().aiScore,
            gameEngine.getState().playerLives,
            DEFAULT_CONFIG.gameDuration - gameEngine.getState().timeRemaining
          );
          break;
      }
    });

    // Save reference
    gameEngineRef.current = gameEngine;

    // Start the game
    gameEngine.start();

    // Start rendering
    startRendering(canvas);

    // Clean up
    return () => {
      if (gameEngine) {
        gameEngine.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [difficulty, onGameOver]);

  // Handle mouse/touch movement for paddle control
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isPaused || isGameOver || !gameEngineRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      gameEngineRef.current.movePlayerPaddle(x - (gameEngineRef.current.getState().playerPaddle.width / 2));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        if (isPaused || isGameOver || !gameEngineRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        gameEngineRef.current.movePlayerPaddle(x - (gameEngineRef.current.getState().playerPaddle.width / 2));
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isPaused, isGameOver]);

  // Handle pause/resume
  const togglePause = () => {
    if (!gameEngineRef.current) return;

    if (isPaused) {
      gameEngineRef.current.resume();
      startRendering(canvasRef.current!);
    } else {
      gameEngineRef.current.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    setIsPaused(!isPaused);
  };

  // Handle game restart
  const restartGame = () => {
    if (!gameEngineRef.current) return;

    gameEngineRef.current.reset();
    setPlayerScore(0);
    setAiScore(0);
    setPlayerLives(DEFAULT_CONFIG.initialLives);
    setAiLives(DEFAULT_CONFIG.initialLives);
    setTimeRemaining(DEFAULT_CONFIG.gameDuration);
    setIsPaused(false);
    setIsGameOver(false);
    startRendering(canvasRef.current!);
  };

  // Rendering function
  const startRendering = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !gameEngineRef.current) return;

    const renderFrame = () => {
      const gameState = gameEngineRef.current!.getState();

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw dividing line
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Draw paddles
      ctx.fillStyle = '#4CAF50'; // Green for player
      ctx.fillRect(
        gameState.playerPaddle.position.x,
        gameState.playerPaddle.position.y,
        gameState.playerPaddle.width,
        gameState.playerPaddle.height
      );

      ctx.fillStyle = '#E91E63'; // Pink for AI
      ctx.fillRect(
        gameState.aiPaddle.position.x,
        gameState.aiPaddle.position.y,
        gameState.aiPaddle.width,
        gameState.aiPaddle.height
      );

      // Draw balls
      gameState.balls.forEach((ball: Ball) => {
        if (!ball.active) return;

        // Determine ball color based on direction (up or down)
        ctx.fillStyle = ball.velocity.y < 0 ? '#4CAF50' : '#E91E63';
        
        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw bricks
      gameState.bricks.forEach((brick: Brick) => {
        if (!brick.active) return;

        // Normal bricks vs special bricks
        ctx.fillStyle = brick.type === BrickType.NORMAL ? '#64B5F6' : '#FFC107';
        ctx.fillRect(
          brick.position.x,
          brick.position.y,
          brick.width,
          brick.height
        );

        // Border for bricks
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          brick.position.x,
          brick.position.y,
          brick.width,
          brick.height
        );
      });

      // Draw power-ups
      gameState.powerUps.forEach((powerUp: PowerUp) => {
        if (!powerUp.active) return;

        let color;
        switch (powerUp.type) {
          case PowerUpType.EXPAND_PADDLE:
            color = '#9C27B0'; // Purple
            break;
          case PowerUpType.EXTRA_BALL:
            color = '#FF5722'; // Orange
            break;
          case PowerUpType.SLOW_BALL:
            color = '#2196F3'; // Blue
            break;
          default:
            color = '#FFFFFF';
        }

        ctx.fillStyle = color;
        ctx.fillRect(
          powerUp.position.x,
          powerUp.position.y,
          powerUp.width,
          powerUp.height
        );
      });

      // Schedule next frame if game is running
      if (!isPaused && !isGameOver) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    // Start the rendering loop
    animationFrameRef.current = requestAnimationFrame(renderFrame);
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 w-full max-w-[800px] flex justify-between items-center bg-gray-800 p-3 rounded-lg">
        <div className="text-lg">
          <span className="text-green-500">Player: {playerScore}</span>
          <span className="mx-2 text-gray-400">|</span>
          <span className="text-red-500">AI: {aiScore}</span>
        </div>
        <div className="text-lg font-mono">
          {formatTime(timeRemaining)}
        </div>
        <div className="text-lg">
          <span className="text-green-500">Lives: {playerLives}</span>
          <span className="mx-2 text-gray-400">|</span>
          <span className="text-red-500">AI Lives: {aiLives}</span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border border-gray-700 rounded-lg shadow-lg"
          width={DEFAULT_CONFIG.width}
          height={DEFAULT_CONFIG.height}
        />

        {(isPaused || isGameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-lg">
            {isPaused && !isGameOver && (
              <h2 className="text-4xl text-white mb-4">PAUSED</h2>
            )}
            {isGameOver && (
              <>
                <h2 className="text-4xl text-white mb-4">GAME OVER</h2>
                <p className="text-2xl text-white mb-6">
                  {playerScore > aiScore ? 'You Win!' : 'AI Wins!'}
                </p>
                <p className="text-xl text-white mb-1">
                  Your Score: {playerScore}
                </p>
                <p className="text-xl text-white mb-6">
                  AI Score: {aiScore}
                </p>
              </>
            )}
            <div className="flex space-x-4">
              {!isGameOver && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-xl"
                  onClick={togglePause}
                >
                  Resume
                </button>
              )}
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-xl"
                onClick={restartGame}
              >
                {isGameOver ? 'Play Again' : 'Restart'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 w-full max-w-[800px] flex justify-center">
        <button
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg mr-4"
          onClick={togglePause}
          disabled={isGameOver}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          onClick={restartGame}
        >
          Restart
        </button>
      </div>
    </div>
  );
};

export default Game; 