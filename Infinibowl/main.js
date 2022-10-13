title = "Infinibowl";

description = `
[click] 
to bowl`;

characters = [
  `
 llll
ll l l
lll ll
llllll
llllll
 llll 
`
,
`
 ll
 ll
llll
llll
 ll 
`
];

// Game constants
const G = {
  WIDTH: 60,
  HEIGHT: 90,
  PINH: 15
}

options = {
   //theme: "pixel",
   viewSize: {x: G.WIDTH, y: G.HEIGHT},
   isPlayingBgm: true,
   isReplayEnabled: true,
   //seed: 100
};

let currLevel = 1;

class BowlingBall {
   constructor() {
      /*
      Constants
      */
      this.BASE_X_VEL = 0.5;
      this.BASE_Y_VEL = 0;

      this.LEFT_SCREEN_BOUND = 5;
      this.RIGHT_SCREEN_BOUND = G.WIDTH - 5;

      this.Y_SPAWN_COORD = G.HEIGHT - 4;

      this.MAX_X_SPD = this.RIGHT_SCREEN_BOUND - this.LEFT_SCREEN_BOUND;

      this.BASE_THROW_SPEED = 1;

      /*
      Mutable Properties
      */
      this.charLetter // May change depending on current animation
      this.x;
      this.y;
      this.xVel;
      this.xVelBeforeRolling;
      this.yVel;
      this.isRolling; // True if going towards pins
   }
   
   calculateThrowSpeed() {
      let xDistFromCenter = abs(this.x - G.WIDTH/2);
      let maxDistFromCenter = (this.RIGHT_SCREEN_BOUND - this.LEFT_SCREEN_BOUND) / 2;
      let propDistFromSide = 1 - (xDistFromCenter/maxDistFromCenter); // Proportion

      let maxThrowMultiplier = 2;
      let minThrowMultiplier = 1;

      let throwSpeedMultiplier = minThrowMultiplier + propDistFromSide * (maxThrowMultiplier - minThrowMultiplier);
      return this.BASE_THROW_SPEED * throwSpeedMultiplier;
   }

   resetProperties() {
      this.charLetter = "a";
      this.x = G.WIDTH/2;
      this.y = this.Y_SPAWN_COORD;
      this.xVelBeforeRolling = 0;
      this.xVel = this.BASE_X_VEL;
      this.yVel = this.BASE_Y_VEL;
   }

   update() {
      // Check for input
      if (input.isJustPressed && !this.isRolling) {
         this.isRolling = true;
         this.xVelBeforeRolling = this.xVel;
         this.xVel = 0;
         this.yVel = -this.calculateThrowSpeed();
      }

      // Update x position
      this.x += clamp(this.xVel, -this.MAX_X_SPD, this.MAX_X_SPD);
      // Prevent the ball from going off left and right sides of screen
      if (ball.x >= this.RIGHT_SCREEN_BOUND) {
         this.xVel *= -1;
         ball.x -= 2 * (ball.x - this.RIGHT_SCREEN_BOUND);
      }
      else if (ball.x <= this.LEFT_SCREEN_BOUND) {
         this.xVel *= -1;
         ball.x += 2 * (this.LEFT_SCREEN_BOUND - ball.x);
      }

      // Update y position
      this.y += this.yVel;
      // If this has rolled offscreen, bring it back
      if (this.y <= 0 - 3) {
         this.y = this.Y_SPAWN_COORD;
         this.yVel = 0;
         this.xVel = this.xVelBeforeRolling;
         this.isRolling = false;
      }

      // Drawing
      char(this.charLetter, this.x, this.y);
   }
}

class PinRow {
   constructor(rowName) {
      /*
      Constants
      */
      this.BASE_X_VEL = rowName == "top" ? 0.75 : -0.75;

      /*
      Mutable Properties
      */
      this.pinArray;
      this.xVel;
   }

   // Takes in which row is being reset as a parameter
   resetProperties() {
      this.pinArray = [];
      this.xVel = this.BASE_X_VEL;
   }

   update() {
      /*
      for (let pin of this.pinArray) {
         // Check for collisions with bowling ball here

         }
      }
      */
   }
}

class CountdownTimer {
   constructor() {
      /*
      Mutable Properties
      */
      let countdownInProgress;
      let countdownFinished;
   }

   resetProperties() {
      this.countdownInProgress = false;
      this.countdownFinished = false;
   }

   update() {
      // Draw text indicating time left
      if (this.countdownInProgress && !this.countdownFinished) {
         
      }
   }
}

let ball = new BowlingBall;
let pinRowTop = new PinRow("top");
let pinRowBottom = new PinRow("bottom");
let timer = new CountdownTimer();

function update() {
   if (!ticks) {
      ball.resetProperties();
      pinRowTop.resetProperties();
      pinRowBottom.resetProperties();
      timer.resetProperties();
   }

   ball.update();
   pinRowBottom.update();
   pinRowTop.update();
   timer.update();

   char("b", G.WIDTH/2, G.PINH);

}  

addEventListener("load", onLoad);