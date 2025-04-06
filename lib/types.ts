// Game configuration types
export interface GameConfig {
  width: number;
  height: number;
  brickRows: number;
  brickCols: number;
  initialLives: number;
  gameDuration: number; // in seconds (120 = 2 minutes)
  aiDifficulty: AIDifficulty;
}

export type AIDifficulty = 'Easy' | 'Normal' | 'Hard';

// Game state interfaces
export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  position: Vector2D;
  width: number;
  height: number;
  active: boolean;
}

export interface Ball extends GameObject {
  velocity: Vector2D;
  radius: number;
  speed: number;
}

export interface Paddle extends GameObject {
  speed: number;
  maxSpeed: number;
}

export enum BrickType {
  NORMAL = 'normal',
  SPECIAL = 'special',
}

export interface Brick extends GameObject {
  type: BrickType;
  points: number;
}

export enum PowerUpType {
  EXPAND_PADDLE = 'expand_paddle',
  EXTRA_BALL = 'extra_ball',
  SLOW_BALL = 'slow_ball',
}

export interface PowerUp extends GameObject {
  type: PowerUpType;
  velocity: Vector2D;
  active: boolean;
}

export interface GameState {
  balls: Ball[];
  playerPaddle: Paddle;
  aiPaddle: Paddle;
  bricks: Brick[];
  powerUps: PowerUp[];
  playerScore: number;
  aiScore: number;
  playerLives: number;
  aiLives: number;
  timeRemaining: number; // in seconds
  gameOver: boolean;
  paused: boolean;
}

// Game engine events
export interface CollisionEvent {
  ball: Ball;
  object: GameObject;
  type: 'brick' | 'paddle' | 'wall';
}

export interface GameEvent {
  type: 'score' | 'life_lost' | 'power_up' | 'game_over' | 'time_update';
  player: 'human' | 'ai';
  value?: number; // Score, life count, or time remaining
  powerUpType?: PowerUpType;
} 