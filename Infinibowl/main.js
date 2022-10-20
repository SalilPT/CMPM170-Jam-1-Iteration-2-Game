title = "Infinibowl";

description = `
[Tap]
Throw`;

characters = [
  `
 rrrr
rr r r
rrr rr
prrrrr
pprrrr
 pppp
`
,
`
 cc
 cc
cccc
bccc
 bb
`
];

// Game constants
const G = {
  WIDTH: 60,
  HEIGHT: 90,
  // Events for classes to use
  PIN_KNOCKED_DOWN_EVENT: new Event("pinKnockedDown"),
  TIMER_FINISHED_EVENT: new Event("timerFinished")
}

options = {
  theme: "pixel",
  viewSize: {x: G.WIDTH, y: G.HEIGHT},
  isPlayingBgm: true,
  isReplayEnabled: false,
  seed: 78
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

    this.MAX_X_SPD = (this.RIGHT_SCREEN_BOUND - this.LEFT_SCREEN_BOUND) / 2;

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
    this.isRolling = false;
  }

  setXVelFromLevel(level) {
    // TODO?: Change this
    this.xVel = this.BASE_X_VEL * sqrt(level);
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
    if (this.x >= this.RIGHT_SCREEN_BOUND) {
      this.xVel *= -1;
      this.x -= 2 * (this.x - this.RIGHT_SCREEN_BOUND);
    }
    else if (this.x <= this.LEFT_SCREEN_BOUND) {
      this.xVel *= -1;
      this.x += 2 * (this.LEFT_SCREEN_BOUND - this.x);
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
        play("hit");
        particle(pin.x, pin.y, 10, 0.75, -PI/2, PI/8);
        pinsToRemove.push(pin);
      }
    }

    this.cleanUpPins(pinsToRemove);
  }
}

class CountdownTimer {
  constructor() {
    /*
    Constants
    */
    this.UI_TEXT_X_COORD = 3;
    this.UI_TEXT_Y_COORD = G.HEIGHT - 3;

    /*
    Mutable Properties
    */
    this.countdownInProgress;
    this.ticksSinceTimerStart;
    this.totalCountdownTicks; // For a countdown of 2 seconds, this would be 120.

    this.displayUIText;
  }

  resetProperties() {
    this.countdownInProgress = false;
    this.ticksSinceTimerStart = 0;
    this.totalCountdownTicks = 0;
    this.displayUIText = false;
  }

  // Takes the number of seconds for the countdown as an argument.
  // Works with non-integer values.
  // The second parameter controls whether or not to show the countdown UI text.
  startCountdown(seconds, display = false) {
    // Ticks occur every 1/60th of a second
    this.totalCountdownTicks = ceil(seconds * 60);

    this.ticksSinceTimerStart = 0;
    this.countdownInProgress = true;
    this.displayUIText = display;
  }

  update() {
    if (this.countdownInProgress) {
      this.ticksSinceTimerStart++;
    }
    if (this.countdownInProgress && (this.ticksSinceTimerStart >= this.totalCountdownTicks)) {
      this.countdownInProgress = false;
      dispatchEvent(G.TIMER_FINISHED_EVENT);
    }

    // Draw text indicating time left
    if (this.displayUIText) {
      let secondsRemaining = floor((this.totalCountdownTicks - this.ticksSinceTimerStart) / 60);
      text("T " + secondsRemaining, this.UI_TEXT_X_COORD, this.UI_TEXT_Y_COORD);
    }
  }
}

class LevelManager {
  constructor() {
    this.currLevel;
    this.numPinsKnockedDown;
    this.numPinsNeededForLevel;

    this.inLevelTransition;
    this.inTransitionPhase1;
    this.inTransitionPhase2;

    this.phase1Text;
    this.phase2TextArray;

    this.pinKnockedDownCallback = () => {
      this.numPinsKnockedDown++;
    }
    addEventListener("pinKnockedDown", this.pinKnockedDownCallback);

    this.levelEndCallback = () => {
      if (this.numPinsKnockedDown < this.numPinsNeededForLevel) {
        end("GAME OVER");
      }
      else {
        this.playLevelTransitionSequence();
      }
      removeEventListener("timerFinished", this.levelEndCallback);
    }
  }

  calculatePinsNeededForLevel() {
    return 10 + ceil(2 * sqrt(this.currLevel - 1));
  }

  calculateTimeForLevel() {
    return 5 + 1.5 * sqrt(this.currLevel + 83); // At level 22: 20 pins or more in 20 secs.
  }

  // Return a vector for the position the given single line of text would need to be drawn to be centered
  getCenteredTextLineCoords(text) {
    let textX = 3 + (G.WIDTH - text.length * 6)/2;
    let textY = G.HEIGHT / 2 - 3;
    return vec(textX, textY);
  }

  getCenteredTextLineXCoord(text) {
    return 3 + (G.WIDTH - text.length * 6)/2;
  }

  playLevelTransitionSequence() {
    this.inLevelTransition = true;
    this.inTransitionPhase1 = true;
    this.currLevel++;

    pinRowBottom.resetProperties();
    pinRowTop.resetProperties();
    ball.resetProperties();

    this.numPinsKnockedDown = 0;
    this.numPinsNeededForLevel = this.calculatePinsNeededForLevel();
    this.phase1Text = "Level " + this.currLevel;

    let transitionPhase1Callback = () => {
      this.phase2TextArray = [
        "Hit " + this.calculatePinsNeededForLevel(),
        "or more",
        "pins in",
        floor(this.calculateTimeForLevel()) + " secs."
      ];

      this.inTransitionPhase1 = false;
      this.inTransitionPhase2 = true;
      timer.startCountdown(3.5);

      removeEventListener("timerFinished", transitionPhase1Callback);
      addEventListener("timerFinished", transitionPhase2Callback);
    };
    let transitionPhase2Callback = () => {
      this.inLevelTransition = false;
      this.inTransitionPhase2 = false;

      // Set up bowling ball and timer for next level
      ball.setXVelFromLevel(this.currLevel);
      timer.startCountdown(this.calculateTimeForLevel(), true);

      removeEventListener("timerFinished", transitionPhase2Callback);
      addEventListener("timerFinished", this.levelEndCallback);
    };

    addEventListener("timerFinished", transitionPhase1Callback);
    timer.startCountdown(1.5);
  }

  resetProperties() {
    this.currLevel = 0;
    this.numPinsKnockedDown = 0;
    this.numPinsNeededForLevel = 0;
    this.inLevelTransition = false;
  }

  update() {
    // Text for number of pins knocked down
    if (!this.inLevelTransition) {
      let textColor = this.numPinsKnockedDown < this.numPinsNeededForLevel ? "yellow" : "green";
      text("P " + this.numPinsKnockedDown, G.WIDTH / 2 + 3, G.HEIGHT - 3, {color: textColor});
    }
    // Level transition text
    else if (this.inTransitionPhase1) {
      text(this.phase1Text, this.getCenteredTextLineCoords(this.phase1Text));
    }
    else if (this.inTransitionPhase2) {
      let currentTextYCoord = G.HEIGHT / 3;
      for (let textLine of this.phase2TextArray) {
        text(textLine, this.getCenteredTextLineXCoord(textLine), currentTextYCoord);
        currentTextYCoord += 8;
      }
    }
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
    levelMgr.resetProperties();

    levelMgr.playLevelTransitionSequence();
  }

  if (!levelMgr.inLevelTransition) {
    ball.update();
    pinRowBottom.update();
    pinRowTop.update();
  }
  timer.update();
  levelMgr.update();
}

addEventListener("load", onLoad);