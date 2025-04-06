import { Ball, Brick, GameObject, Paddle, PowerUp } from './types';

// Check collision between ball and rectangular object
export const checkCollision = (ball: Ball, object: GameObject): boolean => {
  // Find the closest point to the circle within the rectangle
  const closestX = Math.max(object.position.x, Math.min(ball.position.x, object.position.x + object.width));
  const closestY = Math.max(object.position.y, Math.min(ball.position.y, object.position.y + object.height));

  // Calculate the distance between the circle's center and the closest point
  const distanceX = ball.position.x - closestX;
  const distanceY = ball.position.y - closestY;
  const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

  // Check if the distance is less than the circle's radius
  return distanceSquared < (ball.radius * ball.radius);
};

// Handle ball collision with paddle
export const handlePaddleCollision = (ball: Ball, paddle: Paddle): void => {
  // Calculate relative position of the ball on the paddle (0 to 1)
  const hitPosition = (ball.position.x - paddle.position.x) / paddle.width;
  
  // Bounce angle based on where the ball hit the paddle (-1 to 1 range)
  const bounceAngle = (hitPosition - 0.5) * Math.PI * 0.7; // Max 70 degrees
  
  // Set new ball velocity based on the bounce angle
  const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
  ball.velocity.x = Math.sin(bounceAngle) * speed;
  ball.velocity.y = -Math.cos(bounceAngle) * speed; // Always bounce upward
};

// Handle ball collision with brick
export const handleBrickCollision = (ball: Ball, brick: Brick): void => {
  // Find the closest point on the brick to the ball's center
  const closestX = Math.max(brick.position.x, Math.min(ball.position.x, brick.position.x + brick.width));
  const closestY = Math.max(brick.position.y, Math.min(ball.position.y, brick.position.y + brick.height));
  
  // Calculate the collision normal
  const normalX = ball.position.x - closestX;
  const normalY = ball.position.y - closestY;
  
  // Normalize the normal vector
  const magnitude = Math.sqrt(normalX * normalX + normalY * normalY);
  const normalizedX = normalX / magnitude;
  const normalizedY = normalY / magnitude;
  
  // Calculate dot product of velocity and normal
  const dotProduct = ball.velocity.x * normalizedX + ball.velocity.y * normalizedY;
  
  // Reflect velocity based on normal (with a slight randomization for gameplay variety)
  ball.velocity.x = ball.velocity.x - 2 * dotProduct * normalizedX;
  ball.velocity.y = ball.velocity.y - 2 * dotProduct * normalizedY;
  
  // Add a small random factor to avoid repetitive patterns
  ball.velocity.x += (Math.random() - 0.5) * 0.05;
  ball.velocity.y += (Math.random() - 0.5) * 0.05;
};

// Handle wall collisions
export const handleWallCollision = (ball: Ball, gameWidth: number): boolean => {
  let collided = false;
  
  // Left and right walls
  if (ball.position.x - ball.radius <= 0 || ball.position.x + ball.radius >= gameWidth) {
    ball.velocity.x = -ball.velocity.x;
    // Adjust position to prevent sticking to the wall
    if (ball.position.x - ball.radius <= 0) {
      ball.position.x = ball.radius;
    } else {
      ball.position.x = gameWidth - ball.radius;
    }
    collided = true;
  }
  
  // Top wall
  if (ball.position.y - ball.radius <= 0) {
    ball.velocity.y = -ball.velocity.y;
    ball.position.y = ball.radius; // Prevent sticking
    collided = true;
  }
  
  return collided;
};

// Check if ball is below the bottom edge (life lost)
export const isBallLost = (ball: Ball, gameHeight: number): boolean => {
  return ball.position.y - ball.radius > gameHeight;
};

// Update ball position based on velocity
export const updateBallPosition = (ball: Ball, deltaTime: number, gameOver: boolean = false): void => {
  // 게임 오버 후 볼 속도 증가 (2배)
  const speedMultiplier = gameOver ? 2.0 : 1.0;
  ball.position.x += ball.velocity.x * ball.speed * deltaTime * speedMultiplier;
  ball.position.y += ball.velocity.y * ball.speed * deltaTime * speedMultiplier;
};

// Update power-up position and check if caught by paddle
export const updatePowerUp = (
  powerUp: PowerUp, 
  paddle: Paddle, 
  gameHeight: number, 
  deltaTime: number
): boolean => {
  // Update position
  powerUp.position.y += powerUp.velocity.y * deltaTime;
  
  // Check if power-up is caught by paddle
  if (checkCollision({
    ...powerUp,
    radius: Math.min(powerUp.width, powerUp.height) / 2,
    speed: Math.sqrt(powerUp.velocity.x * powerUp.velocity.x + powerUp.velocity.y * powerUp.velocity.y)
  } as Ball, paddle)) {
    return true; // Caught!
  }
  
  // Check if power-up is lost (below bottom edge)
  if (powerUp.position.y > gameHeight) {
    powerUp.active = false;
  }
  
  return false;
}; 