import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [winner, setWinner] = useState<'human' | 'ai' | 'tie' | null>(null);

  // Rendering function wrapped in useCallback
  const startRendering = useCallback((canvas: HTMLCanvasElement) => {
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

      // 게임 오버 시 표시할 텍스트
      if (isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        
        // 승자 표시
        if (winner === 'human') {
          ctx.fillStyle = '#4CAF50';
          ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2);
        } else if (winner === 'ai') {
          ctx.fillStyle = '#E91E63';
          ctx.fillText('AI WINS!', canvas.width / 2, canvas.height / 2);
        } else {
          ctx.fillStyle = '#FFC107';
          ctx.fillText('TIE GAME!', canvas.width / 2, canvas.height / 2);
        }
        
        // 점수 표시
        ctx.font = '24px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Your Score: ${gameState.playerScore}`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText(`AI Score: ${gameState.aiScore}`, canvas.width / 2, canvas.height / 2 + 90);
      }

      // Schedule next frame if game is running or game over (to show final state)
      if (!isPaused) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    // Start the rendering loop
    animationFrameRef.current = requestAnimationFrame(renderFrame);
  }, [isPaused, isGameOver, winner, gameEngineRef, animationFrameRef]);

  // Initialize game engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions - make it responsive
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const maxWidth = Math.min(DEFAULT_CONFIG.width, container.clientWidth);
      const aspectRatio = DEFAULT_CONFIG.height / DEFAULT_CONFIG.width;
      
      canvas.width = maxWidth;
      canvas.height = maxWidth * aspectRatio;
      
      // Adapt game engine elements to new canvas size if already initialized
      if (gameEngineRef.current) {
        gameEngineRef.current.adaptToCanvasSize(canvas.width, canvas.height);
      }
    };

    // Update canvas size initially and on window resize
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Create game engine
    const gameEngine = new GameEngine({
      aiDifficulty: difficulty,
    });

    // Handle game events
    gameEngine.onEvent((event: GameEvent) => {
      switch (event.type) {
        case 'score':
          if (!isGameOver) { // 게임 오버 상태가 아닐 때만 점수 업데이트
            if (event.player === 'human') {
              setPlayerScore(event.value || 0);
            } else {
              setAiScore(event.value || 0);
            }
          }
          break;
        case 'life_lost':
          if (!isGameOver) { // 게임 오버 상태가 아닐 때만 생명 업데이트
            if (event.player === 'human') {
              setPlayerLives(event.value || 0);
            } else {
              setAiLives(event.value || 0);
            }
          }
          break;
        case 'time_update':
          if (!isGameOver) { // 게임 오버 상태가 아닐 때만 시간 업데이트
            setTimeRemaining(event.value || 0);
          }
          break;
        case 'game_over':
          if (!isGameOver) { // 이미 게임 오버 상태가 아닐 때만 처리
            setIsGameOver(true);
            gameEngine.stop();
            
            // 최종 상태에서 점수를 가져와 onGameOver에 전달
            const finalState = gameEngine.getState();
            setPlayerScore(finalState.playerScore);
            setAiScore(finalState.aiScore);
            
            // 승자 결정
            if (finalState.playerScore > finalState.aiScore) {
              setWinner('human');
            } else if (finalState.playerScore < finalState.aiScore) {
              setWinner('ai');
            } else {
              setWinner('tie');
            }
            
            onGameOver(
              finalState.playerScore,
              finalState.aiScore,
              finalState.playerLives,
              DEFAULT_CONFIG.gameDuration - finalState.timeRemaining
            );
          }
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
      window.removeEventListener('resize', updateCanvasSize);
      if (gameEngine) {
        gameEngine.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [difficulty, onGameOver, isGameOver, startRendering]);

  // Handle mouse/touch movement for paddle control
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isPaused || isGameOver || !gameEngineRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width; // 캔버스 내부 크기와 표시 크기의 비율
      const x = (e.clientX - rect.left) * scaleX;
      
      // Convert to game coordinate system
      gameEngineRef.current.movePlayerPaddle(x - (gameEngineRef.current.getState().playerPaddle.width / 2));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        if (isPaused || isGameOver || !gameEngineRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width; // 캔버스 내부 크기와 표시 크기의 비율
        const x = (e.touches[0].clientX - rect.left) * scaleX;
        
        // Convert to game coordinate system
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

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 w-full max-w-[800px] flex flex-col sm:flex-row justify-between items-center bg-gray-800 p-3 rounded-lg">
        <div className="text-lg mb-2 sm:mb-0">
          <span className="text-green-500">Player: {playerScore}</span>
          <span className="mx-2 text-gray-400">|</span>
          <span className="text-red-500">AI: {aiScore}</span>
        </div>
        <div className="text-lg font-mono mb-2 sm:mb-0">
          {formatTime(timeRemaining)}
        </div>
        <div className="text-lg">
          <span className="text-green-500">Lives: {playerLives}</span>
          <span className="mx-2 text-gray-400">|</span>
          <span className="text-red-500">AI Lives: {aiLives}</span>
        </div>
      </div>

      <div className="relative w-full max-w-[800px]">
        <canvas
          ref={canvasRef}
          className="w-full h-auto border border-gray-700 rounded-lg shadow-lg"
        />

        {(isPaused || isGameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-lg">
            {isPaused && !isGameOver && (
              <h2 className="text-2xl sm:text-4xl text-white mb-4">PAUSED</h2>
            )}
            {isGameOver && (
              <>
                <h2 className="text-2xl sm:text-4xl text-white mb-4">GAME OVER</h2>
                <p className={`text-xl sm:text-2xl mb-6 ${
                  winner === 'human' ? 'text-green-400' : 
                  winner === 'ai' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {winner === 'human' ? 'You Win!' : 
                   winner === 'ai' ? 'AI Wins!' : 'Tie Game!'}
                </p>
                <p className="text-lg sm:text-xl text-white mb-1">
                  Your Score: <span className="text-green-400 font-bold">{playerScore}</span>
                </p>
                <p className="text-lg sm:text-xl text-white mb-6">
                  AI Score: <span className="text-red-400 font-bold">{aiScore}</span>
                </p>
              </>
            )}
            <div className="flex space-x-4">
              {!isGameOver && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-lg sm:text-xl"
                  onClick={togglePause}
                >
                  Resume
                </button>
              )}
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-lg sm:text-xl"
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
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg mr-4 text-sm sm:text-base"
          onClick={togglePause}
          disabled={isGameOver}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base"
          onClick={restartGame}
        >
          Restart
        </button>
      </div>
    </div>
  );
};

export default Game; 