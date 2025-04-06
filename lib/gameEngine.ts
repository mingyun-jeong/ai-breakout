import { Ball, Brick, BrickType, GameConfig, GameEvent, GameState, Paddle } from './types';
import { checkCollision, handleBrickCollision, handlePaddleCollision, handleWallCollision, isBallLost, updateBallPosition, updatePowerUp } from './physics';
import { updateAI } from './ai';
import { applyPowerUp, createPowerUp, updatePowerUps } from './powerups';

// Default game configuration
export const DEFAULT_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  brickRows: 5,
  brickCols: 10,
  initialLives: 3,
  gameDuration: 120, // 2 minutes
  aiDifficulty: 'Normal',
};

// Game event callback
type GameEventCallback = (event: GameEvent) => void;

export class GameEngine {
  private config: GameConfig;
  private state: GameState;
  private lastTimestamp: number = 0;
  private eventCallback: GameEventCallback | null = null;
  private gameLoopId: number | null = null;
  
  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
  }
  
  // Initialize or reset the game state
  private createInitialState(): GameState {
    // Create player paddle
    const playerPaddle: Paddle = {
      position: {
        x: this.config.width / 2 - 50,
        y: this.config.height - 30,
      },
      width: 100,
      height: 15,
      speed: 0,
      maxSpeed: 500,
      active: true,
    };
    
    // Create AI paddle
    const aiPaddle: Paddle = {
      position: {
        x: this.config.width / 2 - 50,
        y: 15,
      },
      width: 100,
      height: 15,
      speed: 0,
      maxSpeed: 500,
      active: true,
    };
    
    // Create initial ball
    const ball: Ball = {
      position: {
        x: this.config.width / 2,
        y: this.config.height - 50,
      },
      velocity: {
        x: (Math.random() - 0.5) * 200, // Random horizontal velocity
        y: -300, // Upward velocity
      },
      radius: 8,
      width: 16,
      height: 16,
      speed: 1,
      active: true,
    };
    
    // Create AI ball (moving downward)
    const aiBall: Ball = {
      position: {
        x: this.config.width / 2,
        y: 50,
      },
      velocity: {
        x: (Math.random() - 0.5) * 200, // Random horizontal velocity
        y: 300, // Downward velocity
      },
      radius: 8,
      width: 16,
      height: 16,
      speed: 1,
      active: true,
    };
    
    // Create bricks for both players
    const playerBricks: Brick[] = this.createBricks(this.config.height - 250, false);
    const aiBricks: Brick[] = this.createBricks(50, true);
    
    return {
      balls: [ball, aiBall],
      playerPaddle,
      aiPaddle,
      bricks: [...playerBricks, ...aiBricks],
      powerUps: [],
      playerScore: 0,
      aiScore: 0,
      playerLives: this.config.initialLives,
      aiLives: this.config.initialLives,
      timeRemaining: this.config.gameDuration,
      gameOver: false,
      paused: false,
    };
  }
  
  // Create brick layout
  private createBricks(startY: number, flipped: boolean): Brick[] {
    const bricks: Brick[] = [];
    const brickWidth = (this.config.width - 20) / this.config.brickCols;
    const brickHeight = 20;
    const paddingX = 10;
    const paddingY = 5;
    
    for (let row = 0; row < this.config.brickRows; row++) {
      for (let col = 0; col < this.config.brickCols; col++) {
        // Determine brick type (special bricks are less common)
        const isSpecial = Math.random() < 0.2; // 20% chance for special brick
        
        const brick: Brick = {
          position: {
            x: paddingX + col * brickWidth,
            y: startY + row * (brickHeight + paddingY) * (flipped ? 1 : -1),
          },
          width: brickWidth - 4, // 4px gap between bricks
          height: brickHeight,
          type: isSpecial ? BrickType.SPECIAL : BrickType.NORMAL,
          points: isSpecial ? 30 : 10,
          active: true,
        };
        
        bricks.push(brick);
      }
    }
    
    return bricks;
  }
  
  // Register event handler
  public onEvent(callback: GameEventCallback): void {
    this.eventCallback = callback;
  }
  
  // Start the game loop
  public start(): void {
    if (this.gameLoopId !== null) {
      return; // Game is already running
    }
    
    this.lastTimestamp = performance.now();
    this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  // Pause the game
  public pause(): void {
    this.state.paused = true;
  }
  
  // Resume the game
  public resume(): void {
    if (this.state.paused) {
      this.state.paused = false;
      this.lastTimestamp = performance.now();
    }
  }
  
  // Stop the game loop
  public stop(): void {
    if (this.gameLoopId !== null) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }
  
  // Reset the game
  public reset(): void {
    this.stop();
    this.state = this.createInitialState();
    this.start();
  }
  
  // Main game loop
  private gameLoop(timestamp: number): void {
    // Calculate delta time
    const deltaTime = (timestamp - this.lastTimestamp) / 1000; // convert to seconds
    this.lastTimestamp = timestamp;
    
    // Skip update if paused or game over
    if (!this.state.paused && !this.state.gameOver) {
      this.update(deltaTime);
    }
    
    // Schedule next frame
    this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  // Update game state
  private update(deltaTime: number): void {
    // Update time remaining
    this.state.timeRemaining -= deltaTime;
    
    // Check if time is up
    if (this.state.timeRemaining <= 0) {
      this.state.timeRemaining = 0;
      this.state.gameOver = true;
      
      if (this.eventCallback) {
        // 게임 오버 시 승자 결정
        const winner = this.state.playerScore > this.state.aiScore ? 'human' : 
                      this.state.playerScore < this.state.aiScore ? 'ai' : 'tie';
        
        this.eventCallback({
          type: 'game_over',
          player: winner,
        });
      }
      
      return;
    }
    
    // Update AI paddle with faster speed after game over
    const aiSpeedMultiplier = this.state.gameOver ? 3.0 : 1.0; // 3배 빠르게 설정
    
    updateAI(
      this.state,
      deltaTime * aiSpeedMultiplier, // 게임 오버 시 AI 속도를 빠르게
      this.config.width,
      this.config.aiDifficulty
    );
    
    // Update power-ups
    updatePowerUps(this.state);
    
    // Update falling power-ups
    for (let i = this.state.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.state.powerUps[i];
      
      // Check if power-up is caught by player paddle
      if (updatePowerUp(powerUp, this.state.playerPaddle, this.config.height, deltaTime)) {
        // Apply power-up effect
        applyPowerUp(this.state, powerUp, 'human');
        
        // Remove power-up
        this.state.powerUps.splice(i, 1);
        
        if (this.eventCallback) {
          this.eventCallback({
            type: 'power_up',
            player: 'human',
            powerUpType: powerUp.type,
          });
        }
        
        continue;
      }
      
      // Check if power-up is caught by AI paddle
      if (updatePowerUp(powerUp, this.state.aiPaddle, 0, -deltaTime)) {
        // Apply power-up effect
        applyPowerUp(this.state, powerUp, 'ai');
        
        // Remove power-up
        this.state.powerUps.splice(i, 1);
        
        if (this.eventCallback) {
          this.eventCallback({
            type: 'power_up',
            player: 'ai',
            powerUpType: powerUp.type,
          });
        }
        
        continue;
      }
      
      // Remove inactive power-ups
      if (!powerUp.active) {
        this.state.powerUps.splice(i, 1);
      }
    }
    
    // Update balls
    for (let i = this.state.balls.length - 1; i >= 0; i--) {
      const ball = this.state.balls[i];
      
      if (!ball.active) continue;
      
      // Update ball position
      updateBallPosition(ball, deltaTime, this.state.gameOver);
      
      // Check wall collisions
      handleWallCollision(ball, this.config.width, this.config.height);
      
      // Check if ball is lost (below bottom edge for player, above top edge for AI)
      if (isBallLost(ball, this.config.height)) {
        if (ball.velocity.y > 0) { // Player's ball is lost
          this.state.playerLives--;
          
          if (this.eventCallback) {
            this.eventCallback({
              type: 'life_lost',
              player: 'human',
              value: this.state.playerLives,
            });
          }
          
          if (this.state.playerLives <= 0) {
            this.state.gameOver = true;
            
            if (this.eventCallback) {
              this.eventCallback({
                type: 'game_over',
                player: 'ai',
              });
            }
          } else {
            // Reset ball position
            ball.position.x = this.state.playerPaddle.position.x + this.state.playerPaddle.width / 2;
            ball.position.y = this.state.playerPaddle.position.y - 20;
            ball.velocity.x = (Math.random() - 0.5) * 200;
            ball.velocity.y = -300;
          }
        }
      } else if (ball.position.y < 0) { // AI's ball is lost
        if (ball.velocity.y < 0) {
          this.state.aiLives--;
          
          if (this.eventCallback) {
            this.eventCallback({
              type: 'life_lost',
              player: 'ai',
              value: this.state.aiLives,
            });
          }
          
          if (this.state.aiLives <= 0) {
            this.state.gameOver = true;
            
            if (this.eventCallback) {
              this.eventCallback({
                type: 'game_over',
                player: 'human',
              });
            }
          } else {
            // Reset ball position
            ball.position.x = this.state.aiPaddle.position.x + this.state.aiPaddle.width / 2;
            ball.position.y = this.state.aiPaddle.position.y + this.state.aiPaddle.height + 20;
            ball.velocity.x = (Math.random() - 0.5) * 200;
            ball.velocity.y = 300;
          }
        }
      }
      
      // Check paddle collisions
      if (ball.velocity.y > 0 && checkCollision(ball, this.state.playerPaddle)) {
        handlePaddleCollision(ball, this.state.playerPaddle);
      } else if (ball.velocity.y < 0 && checkCollision(ball, this.state.aiPaddle)) {
        handlePaddleCollision(ball, this.state.aiPaddle);
      }
      
      // Check brick collisions
      for (let j = 0; j < this.state.bricks.length; j++) {
        const brick = this.state.bricks[j];
        
        if (!brick.active) continue;
        
        if (checkCollision(ball, brick)) {
          // Handle collision
          handleBrickCollision(ball, brick);
          
          // Deactivate brick
          brick.active = false;
          
          // Add score to player or AI depending on ball direction
          if (ball.velocity.y < 0) { // Ball moving upward (player's ball)
            this.state.playerScore += brick.points;
            
            if (this.eventCallback) {
              this.eventCallback({
                type: 'score',
                player: 'human',
                value: this.state.playerScore,
              });
            }
          } else { // Ball moving downward (AI's ball)
            this.state.aiScore += brick.points;
            
            if (this.eventCallback) {
              this.eventCallback({
                type: 'score',
                player: 'ai',
                value: this.state.aiScore,
              });
            }
          }
          
          // Create power-up for special bricks
          if (brick.type === BrickType.SPECIAL) {
            this.state.powerUps.push(createPowerUp(brick.position));
          }
        }
      }
    }
    
    // Send time update event every second
    if (Math.floor(this.state.timeRemaining) !== Math.floor(this.state.timeRemaining + deltaTime)) {
      if (this.eventCallback) {
        this.eventCallback({
          type: 'time_update',
          player: 'human', // Not relevant for time
          value: Math.floor(this.state.timeRemaining),
        });
      }
    }
  }
  
  // Move player paddle
  public movePlayerPaddle(position: number): void {
    this.state.playerPaddle.position.x = Math.max(
      0,
      Math.min(this.config.width - this.state.playerPaddle.width, position)
    );
  }
  
  // Get current game state
  public getState(): GameState {
    return this.state;
  }
  
  // Get game configuration
  public getConfig(): GameConfig {
    return this.config;
  }
} 