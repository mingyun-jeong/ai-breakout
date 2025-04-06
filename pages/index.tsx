import React, { useState } from 'react';
import Head from 'next/head';
import Game from '../components/Game';
import Leaderboard from '../components/Leaderboard';
import Settings from '../components/Settings';
import { AIDifficulty } from '../lib/types';
import { saveScore } from '../utils/supabase';

enum GameScreen {
  MENU,
  SETTINGS,
  GAME,
  LEADERBOARD,
}

const HomePage: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>(GameScreen.MENU);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('Normal');
  const [username, setUsername] = useState<string>('');
  const [gameOver, setGameOver] = useState(false);
  const [gameStats, setGameStats] = useState({
    playerScore: 0,
    aiScore: 0,
    playerLives: 0,
    playTime: 0,
  });

  const handleStartGame = () => {
    setCurrentScreen(GameScreen.GAME);
    setGameOver(false);
  };

  const handleShowSettings = () => {
    setCurrentScreen(GameScreen.SETTINGS);
  };

  const handleShowLeaderboard = () => {
    setCurrentScreen(GameScreen.LEADERBOARD);
  };

  const handleBackToMenu = () => {
    setCurrentScreen(GameScreen.MENU);
  };

  const handleGameOver = async (
    playerScore: number,
    aiScore: number,
    playerLives: number,
    playTime: number
  ) => {
    setGameOver(true);
    
    const stats = {
      playerScore,
      aiScore,
      playerLives,
      playTime,
    };
    
    setGameStats(stats);
    
    // Save score to leaderboard
    if (username.trim()) {
      try {
        await saveScore({
          user_name: username,
          score: playerScore,
          play_time: playTime,
          remaining_lives: playerLives,
          difficulty,
        });
      } catch (error) {
        console.error('Error saving score:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>AI Breakout - Human vs AI Brick Breaker</title>
        <meta name="description" content="Challenge the AI in this classic brick-breaking game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto py-8 px-4">
        {currentScreen === GameScreen.MENU && (
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-8 text-gradient">AI Breakout</h1>
            <p className="text-xl mb-12 text-gray-300">
              Challenge the AI in this classic brick-breaking game. Break as many bricks as possible in 2 minutes!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <button
                onClick={handleShowSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg text-xl font-medium transition-colors"
              >
                Play Game
              </button>
              <button
                onClick={handleShowLeaderboard}
                className="bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-lg text-xl font-medium transition-colors"
              >
                Leaderboard
              </button>
              <a
                href="https://github.com/mingyun-jeong/ai-breakout"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-lg text-xl font-medium transition-colors flex items-center justify-center"
              >
                <span>GitHub</span>
              </a>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 mt-12">
              <h2 className="text-2xl font-bold mb-4">How to Play</h2>
              <div className="text-left text-gray-300">
                <p className="mb-2">• Move your paddle with the mouse to bounce the ball</p>
                <p className="mb-2">• Break as many bricks as possible within 2 minutes</p>
                <p className="mb-2">• You start with 3 lives - don&apos;t let the ball fall!</p>
                <p className="mb-2">• Special bricks (yellow) give power-ups and extra points</p>
                <p className="mb-2">• Compete against the AI and compare your scores</p>
              </div>
            </div>
          </div>
        )}

        {currentScreen === GameScreen.SETTINGS && (
          <>
            <button
              onClick={handleBackToMenu}
              className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Menu
            </button>
            <Settings
              difficulty={difficulty}
              username={username}
              onDifficultyChange={setDifficulty}
              onUsernameChange={setUsername}
              onStartGame={handleStartGame}
            />
          </>
        )}

        {currentScreen === GameScreen.GAME && (
          <>
            <button
              onClick={handleBackToMenu}
              className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Menu
            </button>
            <Game difficulty={difficulty} onGameOver={handleGameOver} />
            
            {gameOver && (
              <div className="mt-8 bg-gray-800 rounded-lg p-6 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-center">
                  {gameStats.playerScore > gameStats.aiScore ? 'Victory! 🏆' : 
                   gameStats.playerScore < gameStats.aiScore ? 'Defeat 😢' : 'Tie Game! 🤝'}
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-medium mb-1">Your Score</h3>
                    <p className="text-2xl font-bold text-green-400">{gameStats.playerScore}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-medium mb-1">AI Score</h3>
                    <p className="text-2xl font-bold text-red-400">{gameStats.aiScore}</p>
                  </div>
                </div>
                <button
                  onClick={handleShowLeaderboard}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors mt-2"
                >
                  View Leaderboard
                </button>
              </div>
            )}
          </>
        )}

        {currentScreen === GameScreen.LEADERBOARD && (
          <>
            <button
              onClick={handleBackToMenu}
              className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Menu
            </button>
            <Leaderboard />
          </>
        )}
      </main>

      <footer className="py-6 text-center text-gray-500">
        <p>AI Breakout - Developed with Next.js, TypeScript and Supabase</p>
      </footer>

      <style jsx>{`
        .text-gradient {
          background: linear-gradient(90deg, #4CAF50, #2196F3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
