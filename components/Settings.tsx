import React from 'react';
import { AIDifficulty } from '../lib/types';

interface SettingsProps {
  difficulty: AIDifficulty;
  username: string;
  onDifficultyChange: (difficulty: AIDifficulty) => void;
  onUsernameChange: (username: string) => void;
  onStartGame: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  difficulty,
  username,
  onDifficultyChange,
  onUsernameChange,
  onStartGame,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Game Settings</h2>

      <div className="mb-6">
        <label htmlFor="username" className="block text-gray-300 mb-2">
          Player Name
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded py-2 px-3 focus:outline-none focus:border-blue-500"
          placeholder="Enter your name"
          maxLength={20}
        />
      </div>

      <div className="mb-8">
        <p className="text-gray-300 mb-2">AI Difficulty</p>
        <div className="grid grid-cols-3 gap-4">
          {(['Easy', 'Normal', 'Hard'] as AIDifficulty[]).map((level) => (
            <button
              key={level}
              onClick={() => onDifficultyChange(level)}
              className={`py-2 px-4 rounded-lg transition-colors ${
                difficulty === level
                  ? level === 'Easy'
                    ? 'bg-green-600 text-white'
                    : level === 'Normal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="difficulty-explanation text-sm text-gray-400 mb-6">
        {difficulty === 'Easy' && (
          <p>Easy: AI moves slower with basic prediction. Perfect for beginners!</p>
        )}
        {difficulty === 'Normal' && (
          <p>Normal: Standard AI speed with improved ball tracking.</p>
        )}
        {difficulty === 'Hard' && (
          <p>Hard: Fast AI with advanced ball trajectory prediction. A serious challenge!</p>
        )}
      </div>

      <button
        onClick={onStartGame}
        disabled={!username.trim()}
        className={`w-full py-3 rounded-lg text-white text-lg font-semibold transition-colors ${
          username.trim()
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        Start Game
      </button>
    </div>
  );
};

export default Settings;
