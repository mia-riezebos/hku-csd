/* TODO
 * generate 2-dimensional perlin noise
 * function to lookup noise value at x,y offset
 * convert noise to angle
 * convert angle to x,y vector
 *
 * function to generate set of notes from noise, filtered by a musical key
 * functions to reverse, rearrange & shift notes
 *
 * Notes class with methods to generate, play, stop, draw and translate.
 *
 * function to set BPM, play, framerate, etc.
 */

import { frameRate } from "#/bouncing-ball/environment";
import p5 from "p5";
import { CANVAS, DRAW_MODES, PARTICLE_COUNT } from "./env";
import {
  NOISE,
  EVOLUTION,
  initNoise,
  evolveNoise,
  showNoise,
  showField,
} from "./noise";
import Particle from "./particle";

export default (p: p5) => {
  // for higher resolutions switch to MODES.PIXELS
  const drawMode = DRAW_MODES.RECTANGLES;
  const noiseMode = NOISE.MODES.SIMPLEX;

  let noiseDisplay;
  let particlesDisplay;

  let evolveRates = [];
  let rates = [];

  p.setup = function () {
    p.colorMode(p.HSL);

    p.createCanvas(CANVAS.WIDTH, CANVAS.HEIGHT);

    noiseDisplay = p.createGraphics(CANVAS.WIDTH, CANVAS.HEIGHT);
    noiseDisplay.colorMode(p.HSL);
    particlesDisplay = p.createGraphics(CANVAS.WIDTH, CANVAS.HEIGHT);
    particlesDisplay.colorMode(p.HSL);

    p.frameRate(CANVAS.FRAMERATE);
    initNoise(p, noiseMode);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      Particle.particles.push(new Particle(particlesDisplay));
    }

    p.noStroke();
    p.strokeWeight(0);
    showNoise(noiseDisplay, noiseMode, DRAW_MODES.PIXELS);

    p.stroke(255, 10);
    p.strokeWeight(2);
    // showField(p, noiseMode);
  };

  p.draw = function () {
    if (rates.length < CANVAS.FRAMERATE) rates.push(p.frameRate());
    else {
      rates.shift();
      rates.push(p.frameRate());
    }

    if (EVOLUTION.STATE) {
      evolveRates.push(p.frameRate());
      if (evolveRates.length > CANVAS.FRAMERATE) evolveRates.shift();
      let average = evolveRates.reduce((a, b) => a + b, 0) / evolveRates.length;

      if (evolveRates.length > 15 && average < 60) {
        CANVAS.RESOLUTION = Math.floor(CANVAS.RESOLUTION * 2);
        CANVAS.PIXEL_RATIO = CANVAS.RESOLUTION ** -1;
        [CANVAS.COLUMNS, CANVAS.ROWS] = [
          Math.floor(CANVAS.WIDTH * CANVAS.PIXEL_RATIO),
          Math.floor(CANVAS.HEIGHT * CANVAS.PIXEL_RATIO),
        ];
        evolveRates = [];
      }
    }

    p.background(0, 0, 0);

    if (EVOLUTION.STATE) {
      noiseDisplay.background(0, 0, 0);
      noiseDisplay.noStroke();
      noiseDisplay.strokeWeight(0);
      showNoise(noiseDisplay, noiseMode, drawMode);
    }

    noiseDisplay.stroke(0, 100, 100, 0.5);
    noiseDisplay.strokeWeight(2);
    // showField(noiseDisplay);

    Particle.particles.forEach((particle) => {
      particle.show();
      particle.update();
      particle.applyForce();
    });

    p.image(noiseDisplay, 0, 0);
    p.image(particlesDisplay, 0, 0);

    showFrameRate();
    // p.noLoop();
  };

  p.windowResized = () => {
    p.resizeCanvas(CANVAS.WIDTH, CANVAS.HEIGHT);
  };

  p.mousePressed = () => {
    if (p.mouseButton == p.RIGHT) return;
    if (
      p.mouseX < 0 ||
      p.mouseX >= CANVAS.WIDTH ||
      p.mouseY < 0 ||
      p.mouseY >= CANVAS.HEIGHT
    )
      return;
    EVOLUTION.STATE = !EVOLUTION.STATE;
    if (EVOLUTION.STATE) {
      console.debug("starting noise evolution, simplifying image");
      evolveNoise(p, noiseMode);
      evolveRates = [];
    } else {
      console.debug("stopping noise evolution, generating fullres image");
      initNoise(p, noiseMode);
      showNoise(noiseDisplay, noiseMode, DRAW_MODES.PIXELS);
    }
  };

  function showFrameRate() {
    p.fill(0);
    p.stroke(255);
    p.strokeWeight(2);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      `FPS: ${p.floor(p.frameRate())}\nAVG: ${p.floor(
        rates.reduce((a, b) => a + b, 0) / rates.length
      )}`,
      10,
      10
    );
  }
};
