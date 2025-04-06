import { AIDifficulty, Ball, Brick, GameState, Paddle, Vector2D } from './types';

// AI difficulty settings
const difficultySettings = {
  Easy: {
    speedMultiplier: 0.5,
    predictionAccuracy: 0.7,
    reactionDelay: 0.3, // seconds
    errorChance: 0.3,
  },
  Normal: {
    speedMultiplier: 0.8,
    predictionAccuracy: 0.85,
    reactionDelay: 0.15, // seconds
    errorChance: 0.15,
  },
  Hard: {
    speedMultiplier: 1.0,
    predictionAccuracy: 0.95,
    reactionDelay: 0.05, // seconds
    errorChance: 0.05,
  },
};

// Track the last time the AI updated its decision
let lastUpdateTime = 0;
let targetPosition = 0;

// Calculate the position where the ball will land on the AI's paddle level
export const predictBallLanding = (
  ball: Ball, 
  gameWidth: number, 
  paddleY: number, 
  bricks: Brick[],
  difficulty: AIDifficulty
): number => {
  // Simple prediction for Easy difficulty - just follow the ball
  if (difficulty === 'Easy') {
    return ball.position.x;
  }
  
  // Create a clone of the ball for simulation
  const simulatedBall = {
    ...ball,
    position: { ...ball.position },
    velocity: { ...ball.velocity },
  };
  
  // Maximum simulation steps to prevent infinite loops
  const maxSteps = 1000;
  let steps = 0;
  
  // Simulate ball movement until it reaches the paddle's y-level or max steps
  while (simulatedBall.position.y < paddleY && steps < maxSteps) {
    // Update position
    simulatedBall.position.x += simulatedBall.velocity.x;
    simulatedBall.position.y += simulatedBall.velocity.y;
    
    // Handle wall collisions
    if (simulatedBall.position.x - simulatedBall.radius <= 0 || 
        simulatedBall.position.x + simulatedBall.radius >= gameWidth) {
      simulatedBall.velocity.x = -simulatedBall.velocity.x;
    }
    
    // For Hard difficulty, also consider brick collisions
    if (difficulty === 'Hard') {
      // Simplified brick collision for prediction (just bounce)
      for (const brick of bricks) {
        if (!brick.active) continue;
        
        // Simple AABB collision check
        if (simulatedBall.position.x + simulatedBall.radius > brick.position.x &&
            simulatedBall.position.x - simulatedBall.radius < brick.position.x + brick.width &&
            simulatedBall.position.y + simulatedBall.radius > brick.position.y &&
            simulatedBall.position.y - simulatedBall.radius < brick.position.y + brick.height) {
          
          // Bounce in y direction (simplified)
          simulatedBall.velocity.y = -simulatedBall.velocity.y;
          break;
        }
      }
    }
    
    steps++;
  }
  
  // Add some inaccuracy based on difficulty
  const settings = difficultySettings[difficulty];
  const errorAmount = (Math.random() - 0.5) * (1 - settings.predictionAccuracy) * gameWidth;
  
  return Math.max(0, Math.min(gameWidth, simulatedBall.position.x + errorAmount));
};

// Update AI paddle movement based on difficulty and ball position
export const updateAI = (
  gameState: GameState,
  deltaTime: number,
  gameWidth: number,
  difficulty: AIDifficulty
): void => {
  const { aiPaddle, balls, bricks } = gameState;
  const settings = difficultySettings[difficulty];
  
  // If no active balls, don't move
  if (balls.length === 0 || !balls.some(ball => ball.active)) {
    return;
  }
  
  // Find the closest ball to the paddle
  const closestBall = balls
    .filter(ball => ball.active)
    .reduce((closest, ball) => {
      const distanceToClosest = closest ? Math.abs(closest.position.y - aiPaddle.position.y) : Infinity;
      const distanceToCurrent = Math.abs(ball.position.y - aiPaddle.position.y);
      return distanceToCurrent < distanceToClosest ? ball : closest;
    }, null as Ball | null);
    
  if (!closestBall) return;
  
  // Only update target position periodically (simulates reaction time)
  const currentTime = Date.now() / 1000; // seconds
  if (currentTime - lastUpdateTime > settings.reactionDelay) {
    // Predict where the ball will land
    targetPosition = predictBallLanding(
      closestBall, 
      gameWidth, 
      aiPaddle.position.y,
      bricks,
      difficulty
    );
    
    // Occasionally make a mistake (move away from the ball)
    if (Math.random() < settings.errorChance) {
      const errorOffset = (Math.random() < 0.5 ? -1 : 1) * aiPaddle.width * 0.75;
      targetPosition += errorOffset;
    }
    
    lastUpdateTime = currentTime;
  }
  
  // Calculate the center position of the paddle
  const paddleCenter = aiPaddle.position.x + aiPaddle.width / 2;
  
  // Determine movement direction
  let moveDirection = 0;
  const moveThreshold = 5; // Dead zone to prevent jitter
  
  if (paddleCenter < targetPosition - moveThreshold) {
    moveDirection = 1; // Move right
  } else if (paddleCenter > targetPosition + moveThreshold) {
    moveDirection = -1; // Move left
  }
  
  // Move the paddle based on direction and speed
  const moveSpeed = aiPaddle.maxSpeed * settings.speedMultiplier;
  aiPaddle.position.x += moveDirection * moveSpeed * deltaTime;
  
  // Clamp paddle position to prevent going off-screen
  aiPaddle.position.x = Math.max(0, Math.min(gameWidth - aiPaddle.width, aiPaddle.position.x));
}; 