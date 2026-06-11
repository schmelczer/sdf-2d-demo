import { vec2 } from 'gl-matrix';
import { CircleLight, hsl, Renderer, rgb, runAnimation } from 'sdf-2d';
import { prettyPrint } from '../../helper/pretty-print';
import { Random } from '../../helper/random';
import { settings } from '../../settings';
import { Scene } from '../scene';
import { Body } from './body';

const PLANET_COUNT = 6;
const ASTEROID_COUNT = 18;

// Palette indices used for the bodies (see colorPalette below).
const SUN_COLOR = 5; // warm gold
const ROCK_COLOR = 7; // brown-grey rock
const PLANET_COLORS = [1, 2, 3, 4, 6]; // red, green, blue, purple, pink

interface OrbitingBody {
  drawable: InstanceType<typeof Body>;
  radiusRatio: number; // orbit radius as a fraction of the system radius
  phase: number;
  speed: number;
  sizeRatio: number; // body radius as a fraction of the system radius
  spin: number; // how fast the surface seed rotates
  seedPhase: number;
}

export class OrbitScene implements Scene {
  private overlay: HTMLDivElement;
  public insights?: any;

  // The sun is a bright solid body so it's actually visible: in this engine a
  // light only shows where it reflects off a surface, so a bare light over the
  // near-black "space" background would be invisible. The light sources sit at
  // its centre and illuminate the orbiting bodies. Because the sun is small
  // relative to the orbits, it only mildly occludes its own light.
  private sun = new Body(vec2.create(), 0, SUN_COLOR, 0, 0.6);
  private sunCore = new CircleLight(vec2.create(), rgb(1.0, 0.96, 0.85), 0.05);
  private sunGlow = new CircleLight(vec2.create(), rgb(1.0, 0.62, 0.26), 0.55);

  private bodies: Array<OrbitingBody> = [];

  public async run(canvas: HTMLCanvasElement, overlay: HTMLDivElement): Promise<void> {
    this.overlay = overlay;

    for (let i = 0; i < PLANET_COUNT; i++) {
      const radiusRatio = 0.26 + (0.64 / PLANET_COUNT) * i;
      this.bodies.push({
        drawable: new Body(
          vec2.create(),
          0,
          PLANET_COLORS[i % PLANET_COLORS.length],
          Random.getRandom() * 10,
          1.0
        ),
        radiusRatio,
        phase: Random.getRandom() * Math.PI * 2,
        speed: 0.5 / Math.pow(radiusRatio, 1.5),
        sizeRatio: 0.04 + 0.022 * (i % 3),
        spin: Random.getRandomInRange(-0.5, 0.5),
        seedPhase: Random.getRandom() * 10,
      });
    }

    // An asteroid belt: a ring of small, jagged, fast-tumbling rocks.
    for (let i = 0; i < ASTEROID_COUNT; i++) {
      const radiusRatio = Random.getRandomInRange(0.5, 0.62);
      this.bodies.push({
        drawable: new Body(
          vec2.create(),
          0,
          ROCK_COLOR,
          Random.getRandom() * 10,
          2.6
        ),
        radiusRatio,
        phase: Random.getRandom() * Math.PI * 2,
        speed: 0.5 / Math.pow(radiusRatio, 1.5),
        sizeRatio: Random.getRandomInRange(0.014, 0.026),
        spin: (Random.getRandom() > 0.5 ? 1 : -1) * Random.getRandomInRange(0.8, 2.2),
        seedPhase: Random.getRandom() * 10,
      });
    }

    const bodyCount = this.bodies.length + 1; // + the sun

    await runAnimation(
      canvas,
      [
        {
          ...Body.descriptor,
          shaderCombinationSteps: [0, 4, 8, 16, bodyCount],
        },
        {
          ...CircleLight.descriptor,
          shaderCombinationSteps: [0, 2],
        },
      ],
      this.drawNextFrame.bind(this),
      {
        enableHighDpiRendering: true,
        motionBlur: 0.6,
        ambientLight: rgb(0.17, 0.17, 0.23),
        backgroundColor: rgb(0.02, 0.02, 0.05),
        colorPalette: [
          rgb(1, 1, 1), // 0 white (unused fallback)
          hsl(8, 85, 62), // 1 red
          hsl(150, 65, 55), // 2 green
          hsl(205, 85, 62), // 3 blue
          hsl(275, 70, 68), // 4 purple
          hsl(40, 95, 60), // 5 gold (sun)
          hsl(330, 80, 65), // 6 pink
          hsl(28, 25, 45), // 7 brown-grey rock
        ],
      }
    );
  }

  private drawNextFrame(
    renderer: Renderer,
    currentTime: DOMHighResTimeStamp,
    _: DOMHighResTimeStamp
  ): boolean {
    this.insights = renderer.insights;

    const width = renderer.canvasSize.x;
    const height = renderer.canvasSize.y;
    const maxSide = Math.max(width, height);

    const viewAreaWidth = width / maxSide;
    const viewAreaHeight = height / maxSide;
    renderer.setViewArea(
      vec2.fromValues(0, viewAreaHeight),
      vec2.fromValues(viewAreaWidth, viewAreaHeight)
    );

    this.overlay.innerText = prettyPrint(renderer.insights);

    const center = vec2.fromValues(viewAreaWidth / 2, viewAreaHeight / 2);
    const maxRadius = Math.min(viewAreaWidth, viewAreaHeight) / 2;
    const time = currentTime / 1000;

    // The sun sits in the middle; the light sources live at its centre and a
    // gentle pulse makes the corona breathe.
    vec2.copy(this.sun.center, center);
    this.sun.radius = maxRadius * 0.13;
    this.sun.seed = time * 0.15;
    vec2.copy(this.sunCore.center, center);
    vec2.copy(this.sunGlow.center, center);
    this.sunGlow.intensity = 0.55 + 0.05 * Math.sin(time * 1.7);

    this.bodies.forEach((body) => {
      const angle = body.phase + time * body.speed;
      vec2.set(
        body.drawable.center,
        center.x + Math.cos(angle) * body.radiusRatio * maxRadius,
        center.y + Math.sin(angle) * body.radiusRatio * maxRadius
      );
      body.drawable.radius = body.sizeRatio * maxRadius;
      body.drawable.seed = body.seedPhase + time * body.spin;
    });

    renderer.addDrawable(this.sun);
    this.bodies.forEach((body) => renderer.addDrawable(body.drawable));
    renderer.addDrawable(this.sunCore);
    renderer.addDrawable(this.sunGlow);

    return currentTime < settings.sceneTimeInMilliseconds;
  }
}
