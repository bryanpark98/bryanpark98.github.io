"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameApp = void 0;
var PIXI = require("pixi.js");
var GameApp = /** @class */ (function () {
    function GameApp(parent, width, height) {
        var _this = this;
        this.app = new PIXI.Application({
            resizeTo: window,
        });
        var container = new PIXI.ParticleContainer(5000, {
            position: true,
            rotation: false,
            uvs: false,
            tint: true,
        });
        this.app.stage.addChild(container);
        container.interactive = true;
        var mouseX = -1000;
        var mouseY = -1000;
        container.on("pointermove", function (e) {
            mouseX = e.data.global.x;
            mouseY = e.data.global.y;
        });
        document.body.appendChild(this.app.view);
        var BOID_RADIUS = 3;
        var TURN_FACTOR = 0.2;
        var TURN_PADDING = 10; //
        var VISUAL_RANGE = 40;
        var PROTECTED_RANGE = 8;
        var CENTERING_FACTOR = 0.0005;
        var AVOID_FACTOR = 0.05;
        var MATCHING_FACTOR = 0.05;
        var MAX_SPEED = 5;
        var MIN_SPEED = 2.5;
        var MOUSE_REPULSION = 20; // Strength of mouse repulsion
        var MOUSE_REPULSION_RADIUS = 0; // Radius past which boids are instantly expelled
        var FLOCK_SIZE = 1000;
        var flock = [];
        var _loop_1 = function (i) {
            // Create the sprite and add it to the stage
            var boidGraphics = new PIXI.Graphics();
            boidGraphics.beginFill(0xffffff);
            boidGraphics.drawCircle(0, 0, BOID_RADIUS);
            boidGraphics.endFill();
            var newBoid = {
                sprite: new PIXI.Sprite(this_1.app.renderer.generateTexture(boidGraphics, PIXI.SCALE_MODES.NEAREST, 1)),
                xVel: 0,
                yVel: 0,
            };
            newBoid.sprite.position.y = Math.random() * this_1.app.screen.height;
            newBoid.sprite.position.x = Math.random() * this_1.app.screen.width;
            container.addChild(newBoid.sprite);
            flock.push(newBoid);
            this_1.app.ticker.add(function (delta) {
                var xPosAvg = 0;
                var yPosAvg = 0;
                var xVelAvg = 0;
                var yVelAvg = 0;
                var neighboringBoids = 0;
                var closeDx = 0;
                var closeDy = 0;
                // Calculate behavior determining metrics
                for (var _i = 0, flock_1 = flock; _i < flock_1.length; _i++) {
                    var boid = flock_1[_i];
                    if (boid === newBoid)
                        continue;
                    var dx = newBoid.sprite.x - boid.sprite.x;
                    var dy = newBoid.sprite.y - boid.sprite.y;
                    if (Math.abs(dx) < VISUAL_RANGE && Math.abs(dy) < VISUAL_RANGE) {
                        var squaredDistance = Math.pow(dx, 2) + Math.pow(dy, 2);
                        if (squaredDistance < Math.pow(PROTECTED_RANGE, 2)) {
                            closeDx += newBoid.sprite.x - boid.sprite.x;
                            closeDy += newBoid.sprite.y - boid.sprite.y;
                        }
                        else if (squaredDistance < Math.pow(VISUAL_RANGE, 2)) {
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
                if (newBoid.sprite.x + TURN_PADDING > _this.app.screen.width) {
                    newBoid.xVel -= TURN_FACTOR;
                }
                if (newBoid.sprite.x - TURN_PADDING < 0) {
                    newBoid.xVel += TURN_FACTOR;
                }
                if (newBoid.sprite.y + TURN_PADDING > _this.app.screen.height) {
                    newBoid.yVel -= TURN_FACTOR;
                }
                // Mouse repulsions
                var mouseDx = newBoid.sprite.x - mouseX;
                var mouseDy = newBoid.sprite.y - mouseY;
                var mouseDistance = Math.pow(mouseDx, 2) + Math.pow(mouseDy, 2);
                newBoid.xVel +=
                    mouseDx *
                        (MOUSE_REPULSION /
                            Math.max(mouseDistance - Math.pow(MOUSE_REPULSION_RADIUS, 2), 0.00000001));
                newBoid.yVel +=
                    mouseDy *
                        (MOUSE_REPULSION /
                            Math.max(mouseDistance - Math.pow(MOUSE_REPULSION_RADIUS, 2), 0.00000001));
                // Calculate new positions
                var speed = Math.sqrt(Math.pow(newBoid.xVel, 2) + Math.pow(newBoid.yVel, 2));
                if (speed < MIN_SPEED) {
                    newBoid.xVel = (newBoid.xVel / speed) * MIN_SPEED;
                    newBoid.yVel = (newBoid.yVel / speed) * MIN_SPEED;
                }
                else {
                    newBoid.xVel = (newBoid.xVel / speed) * MAX_SPEED;
                    newBoid.yVel = (newBoid.yVel / speed) * MAX_SPEED;
                }
                newBoid.sprite.x = newBoid.sprite.x + newBoid.xVel;
                newBoid.sprite.y = newBoid.sprite.y + newBoid.yVel;
            });
        };
        var this_1 = this;
        for (var i = 0; i < FLOCK_SIZE; i++) {
            _loop_1(i);
        }
    }
    return GameApp;
}());
exports.GameApp = GameApp;
