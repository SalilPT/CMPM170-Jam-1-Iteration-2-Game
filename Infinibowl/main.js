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
  // Events for classes to use
  PIN_KNOCKED_DOWN_EVENT: new Event("pinKnockedDown"),
  TIME_UP_EVENT: new Event("timeUp")
}

options = {
  //theme: "pixel",
  viewSize: {x: G.WIDTH, y: G.HEIGHT},
  isPlayingBgm: true,
  isReplayEnabled: true,
  //seed: 100
};

class BowlingBall {
  constructor() {
    /*
    Constants
    */
    this.BASE_X_VEL = 0.5;
    this.BASE_Y_VEL = 0;

    this.LEFT_SCREEN_BOUND = 5;
    this.RIGHT_SCREEN_BOUND = G.WIDTH - 5;

    this.Y_SPAWN_COORD = G.HEIGHT - 12; // Give some room for UI on bottom of screen

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
    let xDistFromCenter = abs(this.x - G.WIDTH / 2);
    let maxDistFromCenter = (this.RIGHT_SCREEN_BOUND - this.LEFT_SCREEN_BOUND) / 2;
    let propDistFromSide = 1 - (xDistFromCenter / maxDistFromCenter); // Proportion

    let maxThrowMultiplier = 2;
    let minThrowMultiplier = 1;

    let throwSpeedMultiplier = minThrowMultiplier + propDistFromSide * (maxThrowMultiplier - minThrowMultiplier);
    return this.BASE_THROW_SPEED * throwSpeedMultiplier;
  }

  resetProperties() {
    this.charLetter = "a";
    this.x = G.WIDTH / 2;
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
      play("synth", {note: "C1"});
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
    this.BASE_X_VEL = rowName == "bottom" ? 0.25 : -0.25;
    this.X_SPAWN_COORD = rowName == "bottom" ? -3 : G.WIDTH + 3;
    this.Y_SPAWN_COORD = rowName == "bottom" ? 18 : 10;

    this.PIN_CHAR_LETTER = "b";

    /*
    Mutable Properties
    */
    this.pinArray;
    this.xVel;
  }

  cleanUpPins(pinsToRemove) {
    remove(this.pinArray, (p) => {return pinsToRemove.includes(p);});
  }

  createNewPin() {
    this.pinArray.push({
      x: this.X_SPAWN_COORD,
      y: this.Y_SPAWN_COORD
    });
  }

  resetProperties() {
    this.pinArray = [];
    this.xVel = this.BASE_X_VEL;
  }

  update() {
    if (this.pinArray.length == 0
      || (rndi(30) == 0 && abs((this.pinArray.at(-1).x) - this.X_SPAWN_COORD) > 4)) { // Add some spawning randomness
      this.createNewPin();
    }

    let pinsToRemove = [];
    for (let pin of this.pinArray) {
      // Update position
      pin.x += this.xVel;
      if (pin.x <= -3 || pin.x >= G.WIDTH + 3) {
        pinsToRemove.push(pin);
      }

      // Check for collisions with bowling ball
      let pinCollision = char(this.PIN_CHAR_LETTER, pin.x, pin.y);
      if (pinCollision.isColliding.char[ball.charLetter]) {
        score += 1;
        dispatchEvent(G.PIN_KNOCKED_DOWN_EVENT);
        play("hit", {note: "F3"});
        pinsToRemove.push(pin);
      }
    }

    this.cleanUpPins(pinsToRemove);
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

class LevelManager {
  constructor() {
    let currLevel;
    let numPinsKnockedDown;
    let numPinsNeededForLevel;
    addEventListener("pinKnockedDown", () => {console.log("Pin knocked down")});
  }

  calculatePinsNeededForLevel() {

  }

  resetProperties() {
    this.currLevel = 1;
    this.numPinsKnockedDown = 0;
    this.numPinsNeededForLevel = this.calculatePinsNeededForLevel();
  }
}

let ball = new BowlingBall;
let pinRowTop = new PinRow("top");
let pinRowBottom = new PinRow("bottom");
let timer = new CountdownTimer();
let levelMgr = new LevelManager();

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
}

addEventListener("load", onLoad);