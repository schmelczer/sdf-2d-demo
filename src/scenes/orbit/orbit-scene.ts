import { vec2 } from 'gl-matrix';
import { CircleLight, hsl, Renderer, rgb, runAnimation } from 'sdf-2d';
import { prettyPrint } from '../../helper/pretty-print';
import { Random } from '../../helper/random';
import { settings } from '../../settings';
import { Scene } from '../scene';
import { Body, BodyStyleName } from './body';

// Every colour the scene uses; bodies reference entries by name and mix their
// two colours per fragment in the shader, so nothing renders as a flat fill.
const palette = {
  white: rgb(1, 1, 1),
  sunGold: hsl(38, 100, 62),
  sunEmber: hsl(14, 95, 46),
  scorchedTan: hsl(32, 22, 60),
  scorchedBrown: hsl(20, 25, 38),
  venusCream: hsl(46, 85, 78),
  venusAmber: hsl(33, 75, 58),
  earthLand: hsl(135, 50, 45),
  earthOcean: hsl(213, 85, 52),
  marsRust: hsl(16, 80, 55),
  marsShadow: hsl(22, 65, 34),
  jovianCream: hsl(36, 70, 75),
  jovianRust: hsl(16, 65, 52),
  saturnSand: hsl(45, 65, 76),
  saturnDust: hsl(36, 50, 58),
  ringGold: hsl(44, 40, 70),
  ringShadow: hsl(40, 28, 42),
  iceAzure: hsl(200, 90, 68),
  iceDeep: hsl(232, 70, 50),
  moonGrey: hsl(220, 10, 68),
  moonShadow: hsl(225, 12, 44),
};
type PaletteColor = keyof typeof palette;
const paletteIndex = (name: PaletteColor): number => Object.keys(palette).indexOf(name);

interface MoonSpec {
  orbit: number; // around the parent planet, as a fraction of the system radius
  size: number;
  speed: number; // rad/s
}

interface PlanetSpec {
  orbit: number; // fraction of the system radius
  size: number;
  style: BodyStyleName;
  colors: [PaletteColor, PaletteColor];
  spin: number; // how fast the surface pattern drifts
  ringSize?: number;
  moons?: Array<MoonSpec>;
}

// A miniature solar system: small rocky worlds inside, then the giants —
// banded, ringed, and an ice giant — spread roughly evenly from the sun's
// doorstep to the screen edge. Planets all orbit prograde at Kepler speeds
// (∝ orbit⁻¹·⁵).
const PLANETS: Array<PlanetSpec> = [
  {
    orbit: 0.165,
    size: 0.026,
    style: 'rocky',
    colors: ['scorchedTan', 'scorchedBrown'],
    spin: 0.55,
  },
  {
    orbit: 0.27,
    size: 0.036,
    style: 'banded',
    colors: ['venusCream', 'venusAmber'],
    spin: 0.4,
  },
  {
    orbit: 0.385,
    size: 0.04,
    style: 'rocky',
    colors: ['earthLand', 'earthOcean'],
    spin: 0.45,
    moons: [{ orbit: 0.06, size: 0.01, speed: 2.4 }],
  },
  {
    orbit: 0.49,
    size: 0.03,
    style: 'rocky',
    colors: ['marsRust', 'marsShadow'],
    spin: 0.5,
  },
  {
    orbit: 0.7,
    size: 0.06,
    style: 'banded',
    colors: ['jovianCream', 'jovianRust'],
    spin: 0.3,
    moons: [
      { orbit: 0.085, size: 0.011, speed: 1.8 },
      { orbit: 0.108, size: 0.009, speed: 1.2 },
    ],
  },
  {
    orbit: 0.825,
    size: 0.042,
    style: 'banded',
    colors: ['saturnSand', 'saturnDust'],
    spin: 0.32,
    ringSize: 0.082,
  },
  { orbit: 0.95, size: 0.036, style: 'ice', colors: ['iceAzure', 'iceDeep'], spin: 0.45 },
];

const ORBITAL_SPEED = 0.26; // rad/s at orbit = 1; scaled by Kepler's third law

interface OrbitingBody {
  drawable: Body;
  orbit: number; // around the sun — or around `parent`, for moons and rings
  phase: number;
  speed: number;
  size: number;
  spin: number;
  seedPhase: number;
  parent?: OrbitingBody;
}

export class OrbitScene implements Scene {
  private overlay: HTMLDivElement;
  public insights?: any;

  // The sun's visible disc carries its own white-hot → ember gradient; these
  // lights add the blown-out core, the warm corona reflecting off the lifted
  // background, and the sunlight (plus shadows) on everything orbiting.
  private sunCore = new CircleLight(vec2.create(), rgb(1.0, 0.96, 0.88), 0.1);
  private sunGlow = new CircleLight(vec2.create(), rgb(1.35, 0.58, 0.18), 0.5);

  private sun: OrbitingBody = {
    drawable: new Body(
      vec2.create(),
      0,
      'sun',
      paletteIndex('sunGold'),
      paletteIndex('sunEmber'),
      0
    ),
    orbit: 0,
    phase: 0,
    speed: 0,
    size: 0.115,
    spin: 0.9,
    seedPhase: Random.getRandom() * 10,
  };

  private bodies: Array<OrbitingBody> = [];

  public async run(canvas: HTMLCanvasElement, overlay: HTMLDivElement): Promise<void> {
    this.overlay = overlay;

    this.bodies.push(this.sun);

    PLANETS.forEach((spec) => {
      const planet = this.createOrbitingBody(
        spec.orbit,
        spec.size,
        spec.style,
        spec.colors,
        spec.spin
      );
      this.bodies.push(planet);

      if (spec.ringSize) {
        this.bodies.push({
          ...this.createOrbitingBody(
            0,
            spec.ringSize,
            'rings',
            ['ringGold', 'ringShadow'],
            0
          ),
          parent: planet,
        });
      }

      spec.moons?.forEach((moon) => {
        this.bodies.push({
          ...this.createOrbitingBody(
            moon.orbit,
            moon.size,
            'moon',
            ['moonGrey', 'moonShadow'],
            0.8
          ),
          speed: moon.speed,
          parent: planet,
        });
      });
    });

    const bodyCount = this.bodies.length;

    await runAnimation(
      canvas,
      [
        {
          ...Body.descriptor,
          shaderCombinationSteps: [...new Set([0, 4, 8, 16, 32, bodyCount])],
        },
        {
          ...CircleLight.descriptor,
          shaderCombinationSteps: [0, 2],
        },
      ],
      this.drawNextFrame.bind(this),
      {
        enableHighDpiRendering: true,
        motionBlur: 0.5,
        lightPenetrationRatio: 0.8,
        ambientLight: rgb(0.07, 0.075, 0.145),
        backgroundColor: rgb(0.035, 0.035, 0.07),
        colorPalette: Object.values(palette),
      }
    );
  }

  private createOrbitingBody(
    orbit: number,
    size: number,
    style: BodyStyleName,
    colors: [PaletteColor, PaletteColor],
    spin: number
  ): OrbitingBody {
    return {
      drawable: new Body(
        vec2.create(),
        0,
        style,
        paletteIndex(colors[0]),
        paletteIndex(colors[1]),
        0
      ),
      orbit,
      phase: Random.getRandom() * Math.PI * 2,
      speed: orbit > 0 ? ORBITAL_SPEED / Math.pow(orbit, 1.5) : 0,
      size,
      spin,
      seedPhase: Random.getRandom() * 10,
    };
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

    vec2.copy(this.sunCore.center, center);
    vec2.copy(this.sunGlow.center, center);
    this.sunGlow.intensity = 0.5 + 0.05 * Math.sin(time * 1.7);

    // Parents are pushed before their moons and rings, so each parent's
    // position is already up to date when its satellites read it.
    this.bodies.forEach((body) => {
      const angle = body.phase + time * body.speed;
      const origin = body.parent?.drawable.center ?? center;
      vec2.set(
        body.drawable.center,
        origin[0] + Math.cos(angle) * body.orbit * maxRadius,
        origin[1] + Math.sin(angle) * body.orbit * maxRadius
      );
      // The sun breathes gently; everything else keeps its size.
      const pulse = body === this.sun ? 1 + 0.015 * Math.sin(time * 2.4) : 1;
      body.drawable.radius = body.size * maxRadius * pulse;
      body.drawable.seed = body.seedPhase + time * body.spin;
      body.drawable.litAngle = Math.atan2(
        center[1] - body.drawable.center[1],
        center[0] - body.drawable.center[0]
      );
    });

    this.bodies.forEach((body) => renderer.addDrawable(body.drawable));
    renderer.addDrawable(this.sunCore);
    renderer.addDrawable(this.sunGlow);

    return currentTime < settings.sceneTimeInMilliseconds;
  }
}
