# AI Breakout

A classic brick-breaking game where you compete against an AI opponent. Break as many bricks as possible within the time limit and achieve the highest score!

## Features

- Classic brick-breaking gameplay
- Human vs AI competition with different difficulty levels
- Power-ups from special bricks
- Time-limited matches (2 minutes)
- Global leaderboard with Supabase
- Responsive design

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Game Engine**: HTML5 Canvas with custom physics
- **Backend**: Supabase for authentication and leaderboard

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-breakout.git
   cd ai-breakout
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a Supabase account at [supabase.com](https://supabase.com)
   - Create a new project
   - Create a table named `leaderboard` with the following structure:
     - `id` (uuid, primary key)
     - `user_name` (text, not null)
     - `score` (integer, not null)
     - `play_time` (integer, not null) - in seconds
     - `remaining_lives` (integer, not null)
     - `difficulty` (text, not null)
     - `created_at` (timestamp with timezone, default: now())
   - Update the `.env.local` file with your Supabase URL and anonymous key

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Game Controls

- Move your paddle with the mouse
- Use settings to select the AI difficulty level before starting the game
- Click the pause button to pause/resume the game

## AI Difficulty Levels

- **Easy**: Slow paddle movement, basic prediction
- **Normal**: Standard speed, improved prediction
- **Hard**: Fast paddle movement, advanced trajectory prediction

## License

MIT
