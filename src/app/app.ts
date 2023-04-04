import { bomberFrames } from "../assets/loader";
import * as PIXI from "pixi.js";
import { getRandomArbitrary, hslToHex } from "./utils";

type Boid = {
  sprite: PIXI.Sprite;
  xVel: number;
  yVel: number;
};

export class GameApp {
  private app: PIXI.Application;

  constructor(parent: HTMLElement, width: number, height: number) {
    this.app = new PIXI.Application({
      resizeTo: window,
    });

    const container = new PIXI.ParticleContainer(5000, {
      position: true,
      rotation: false,
      uvs: false,
      tint: true,
    });

    this.app.stage.addChild(container);
    container.interactive = true;

    let mouseX = -1000;
    let mouseY = -1000;
    container.on("pointermove", (e) => {
      mouseX = e.data.global.x;
      mouseY = e.data.global.y;
    });

    document.body.appendChild(this.app.view);

    const BOID_RADIUS = 3;
    const TURN_FACTOR = 0.2;
    const TURN_PADDING = 10; //
    const VISUAL_RANGE = 40;
    const PROTECTED_RANGE = 8;
    const CENTERING_FACTOR = 0.0005;
    const AVOID_FACTOR = 0.05;
    const MATCHING_FACTOR = 0.05;
    const MAX_SPEED = 5;
    const MIN_SPEED = 2.5;
    const MOUSE_REPULSION = 20; // Strength of mouse repulsion
    const MOUSE_REPULSION_RADIUS = 0; // Radius past which boids are instantly expelled
    const FLOCK_SIZE = 1000;

    const flock: Boid[] = [];
    for (let i = 0; i < FLOCK_SIZE; i++) {
      // Create the sprite and add it to the stage
      const boidGraphics = new PIXI.Graphics();
      boidGraphics.beginFill(0xffffff);
      boidGraphics.drawCircle(0, 0, BOID_RADIUS);
      boidGraphics.endFill();

      let newBoid: Boid = {
        sprite: new PIXI.Sprite(
          this.app.renderer.generateTexture(
            boidGraphics,
            PIXI.SCALE_MODES.NEAREST,
            1
          )
        ),
        xVel: 0,
        yVel: 0,
      };

      newBoid.sprite.position.y = Math.random() * this.app.screen.height;
      newBoid.sprite.position.x = Math.random() * this.app.screen.width;

      container.addChild(newBoid.sprite);
      flock.push(newBoid);

      this.app.ticker.add((delta) => {
        let xPosAvg = 0;
        let yPosAvg = 0;
        let xVelAvg = 0;
        let yVelAvg = 0;
        let neighboringBoids = 0;
        let closeDx = 0;
        let closeDy = 0;

        // Calculate behavior determining metrics
        for (const boid of flock) {
          if (boid === newBoid) continue;

          const dx = newBoid.sprite.x - boid.sprite.x;
          const dy = newBoid.sprite.y - boid.sprite.y;

          if (Math.abs(dx) < VISUAL_RANGE && Math.abs(dy) < VISUAL_RANGE) {
            const squaredDistance = dx ** 2 + dy ** 2;
            if (squaredDistance < PROTECTED_RANGE ** 2) {
              closeDx += newBoid.sprite.x - boid.sprite.x;
              closeDy += newBoid.sprite.y - boid.sprite.y;
            } else if (squaredDistance < VISUAL_RANGE ** 2) {
              xPosAvg += boid.sprite.x;
              yPosAvg += boid.sprite.y;
              xVelAvg += boid.xVel;
              yVelAvg += boid.yVel;
              neighboringBoids += 1;
            }
          }
        }

        // Normalize / make vel adjustments
        if (neighboringBoids > 0) {
          xPosAvg = xPosAvg / neighboringBoids;
          yPosAvg = yPosAvg / neighboringBoids;
          xVelAvg = xVelAvg / neighboringBoids;
          yVelAvg = yVelAvg / neighboringBoids;

          newBoid.xVel =
            newBoid.xVel +
            (xPosAvg - newBoid.sprite.x) * CENTERING_FACTOR +
            (xVelAvg - newBoid.xVel) * MATCHING_FACTOR;
          newBoid.yVel =
            newBoid.yVel +
            (yPosAvg - newBoid.sprite.y) * CENTERING_FACTOR +
            (yVelAvg - newBoid.yVel) * MATCHING_FACTOR;
        }

        newBoid.xVel = newBoid.xVel + closeDx * AVOID_FACTOR;
        newBoid.yVel = newBoid.yVel + closeDy * AVOID_FACTOR;

        // Avoid wall collisions
        if (newBoid.sprite.y - TURN_PADDING < 0) {
          newBoid.yVel += TURN_FACTOR;
        }
        if (newBoid.sprite.x + TURN_PADDING > this.app.screen.width) {
          newBoid.xVel -= TURN_FACTOR;
        }
        if (newBoid.sprite.x - TURN_PADDING < 0) {
          newBoid.xVel += TURN_FACTOR;
        }
        if (newBoid.sprite.y + TURN_PADDING > this.app.screen.height) {
          newBoid.yVel -= TURN_FACTOR;
        }

        // Mouse repulsions
        const mouseDx = newBoid.sprite.x - mouseX;
        const mouseDy = newBoid.sprite.y - mouseY;

        const mouseDistance = mouseDx ** 2 + mouseDy ** 2;
        newBoid.xVel +=
          mouseDx *
          (MOUSE_REPULSION /
            Math.max(mouseDistance - MOUSE_REPULSION_RADIUS ** 2, 0.00000001));
        newBoid.yVel +=
          mouseDy *
          (MOUSE_REPULSION /
            Math.max(mouseDistance - MOUSE_REPULSION_RADIUS ** 2, 0.00000001));

        // Calculate new positions
        const speed = Math.sqrt(newBoid.xVel ** 2 + newBoid.yVel ** 2);

        if (speed < MIN_SPEED) {
          newBoid.xVel = (newBoid.xVel / speed) * MIN_SPEED;
          newBoid.yVel = (newBoid.yVel / speed) * MIN_SPEED;
        } else {
          newBoid.xVel = (newBoid.xVel / speed) * MAX_SPEED;
          newBoid.yVel = (newBoid.yVel / speed) * MAX_SPEED;
        }

        newBoid.sprite.x = newBoid.sprite.x + newBoid.xVel;
        newBoid.sprite.y = newBoid.sprite.y + newBoid.yVel;
      });
    }
  }
}
