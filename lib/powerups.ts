import { Ball, GameState, PowerUp, PowerUpType, Vector2D } from './types';
import { DEFAULT_CONFIG } from './gameEngine';

// Constants for power-up effects
const POWER_UP_EFFECTS = {
  [PowerUpType.EXPAND_PADDLE]: {
    duration: 10000, // 10 seconds
    widthMultiplier: 1.5,
  },
  [PowerUpType.EXTRA_BALL]: {
    maxExtraBalls: 3,
  },
  [PowerUpType.SLOW_BALL]: {
    duration: 8000, // 8 seconds
    speedMultiplier: 0.7,
  },
};

// Active power-ups with expiration times
interface ActivePowerUp {
  type: PowerUpType;
  player: 'human' | 'ai';
  expiresAt: number; // timestamp
}

const activePowerUps: ActivePowerUp[] = [];

// Create a new power-up at the position of a broken brick
export const createPowerUp = (position: Vector2D): PowerUp => {
  // Randomly select a power-up type
  const powerUpTypes = Object.values(PowerUpType);
  const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  
  return {
    position: { ...position },
    width: 30,
    height: 15,
    active: true,
    type: randomType,
    velocity: { x: 0, y: 100 }, // Fall downward
  };
};

// Apply a power-up effect to the game state
export const applyPowerUp = (gameState: GameState, powerUp: PowerUp, player: 'human' | 'ai'): void => {
  const paddle = player === 'human' ? gameState.playerPaddle : gameState.aiPaddle;
  
  switch (powerUp.type) {
    case PowerUpType.EXPAND_PADDLE: {
      // Store original width to restore later
      const originalWidth = paddle.width;
      
      // Expand the paddle
      paddle.width *= POWER_UP_EFFECTS[PowerUpType.EXPAND_PADDLE].widthMultiplier;
      
      // Keep the paddle centered at the same position
      paddle.position.x -= (paddle.width - originalWidth) / 2;
      
      // Add to active power-ups with expiration time
      activePowerUps.push({
        type: PowerUpType.EXPAND_PADDLE,
        player,
        expiresAt: Date.now() + POWER_UP_EFFECTS[PowerUpType.EXPAND_PADDLE].duration,
      });
      break;
    }
    
    case PowerUpType.EXTRA_BALL: {
      // Check if we've reached the maximum number of balls
      const playerBalls = gameState.balls.filter(b => 
        (player === 'human' && b.position.y > DEFAULT_CONFIG.height / 2) || 
        (player === 'ai' && b.position.y < DEFAULT_CONFIG.height / 2)
      );
      
      if (playerBalls.length < POWER_UP_EFFECTS[PowerUpType.EXTRA_BALL].maxExtraBalls) {
        // Create a new ball with a different angle
        const sourceBall = gameState.balls.find(b => b.active) || {
          position: {
            x: paddle.position.x + paddle.width / 2,
            y: player === 'human' ? paddle.position.y - 10 : paddle.position.y + paddle.height + 10
          },
          velocity: { x: 0, y: player === 'human' ? -1 : 1 },
          radius: 8,
          speed: 300,
          width: 16,
          height: 16,
          active: true,
        };
        
        // Create the new ball with a different angle
        const angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25; // -45 to 45 degrees
        const newBall: Ball = {
          ...sourceBall,
          position: { ...sourceBall.position },
          velocity: {
            x: Math.sin(angle) * Math.sign(sourceBall.velocity.x || 1),
            y: Math.cos(angle) * Math.sign(sourceBall.velocity.y || (player === 'human' ? -1 : 1)),
          },
          active: true,
        };
        
        gameState.balls.push(newBall);
      }
      break;
    }
    
    case PowerUpType.SLOW_BALL: {
      // Apply to all active balls
      gameState.balls.forEach(ball => {
        if (ball.active) {
          // Apply speed multiplier
          ball.speed *= POWER_UP_EFFECTS[PowerUpType.SLOW_BALL].speedMultiplier;
          
          // Add to active power-ups with expiration time
          activePowerUps.push({
            type: PowerUpType.SLOW_BALL,
            player,
            expiresAt: Date.now() + POWER_UP_EFFECTS[PowerUpType.SLOW_BALL].duration,
          });
        }
      });
      break;
    }
  }
};

// Update active power-ups and expire them when needed
export const updatePowerUps = (gameState: GameState): void => {
  const currentTime = Date.now();
  const expiredPowerUps = activePowerUps.filter(pu => pu.expiresAt <= currentTime);
  
  // Remove expired power-ups and revert their effects
  for (const powerUp of expiredPowerUps) {
    const paddle = powerUp.player === 'human' ? gameState.playerPaddle : gameState.aiPaddle;
    
    switch (powerUp.type) {
      case PowerUpType.EXPAND_PADDLE:
        // Revert paddle size
        paddle.width /= POWER_UP_EFFECTS[PowerUpType.EXPAND_PADDLE].widthMultiplier;
        // Keep the paddle centered
        paddle.position.x += (paddle.width * POWER_UP_EFFECTS[PowerUpType.EXPAND_PADDLE].widthMultiplier - paddle.width) / 2;
        break;
        
      case PowerUpType.SLOW_BALL:
        // Revert ball speed
        gameState.balls.forEach(ball => {
          if (ball.active) {
            ball.speed /= POWER_UP_EFFECTS[PowerUpType.SLOW_BALL].speedMultiplier;
          }
        });
        break;
    }
    
    // Remove from active power-ups
    const index = activePowerUps.indexOf(powerUp);
    if (index !== -1) {
      activePowerUps.splice(index, 1);
    }
  }
}; 