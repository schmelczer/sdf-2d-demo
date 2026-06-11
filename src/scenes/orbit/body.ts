import { mat2d, vec2 } from 'gl-matrix';
import { Drawable, DrawableDescriptor } from 'sdf-2d';

/**
 * Every visual style a body can take. The style selects both the outline
 * (smooth disc, jagged asteroid, ring annulus) and the per-fragment surface
 * colouring inside the SDF shader — gradients, bands, continents — instead of
 * a single flat palette colour.
 */
export const BodyStyle = {
  sun: 0, // radial white-hot → gold → ember gradient with simmering granules
  rocky: 1, // two-tone continent blotches
  banded: 2, // wavy gas-giant stripes
  ice: 3, // swirling azure sheen
  asteroid: 4, // jagged outline, speckled surface
  rings: 5, // two concentric annuli (drawn around a planet)
  moon: 6, // small cratered grey
  star: 7, // tiny twinkle, colour boosted far above 1 to stay bright after
  //          being multiplied by the dim ambient lighting
} as const;
export type BodyStyleName = keyof typeof BodyStyle;

/**
 * One celestial body: sun, planet, moon, ring system, asteroid, comet
 * particle, or background star. A single descriptor renders all of them.
 *
 * Each instance carries two palette colour indices (mixed per fragment by its
 * style), a `seed` that animates its surface, and `litAngle` — the direction
 * towards the sun — used to shade a day/night terminator. Outline roughness is
 * derived from the style inside the shader.
 */
export class Body extends Drawable {
  // The outline harmonics can push the surface outward by at most
  // 0.12 × roughness, and the roughest style (asteroid) uses 2.6.
  private static readonly MAX_OUTLINE_GROWTH = 1.45;

  public static descriptor: DrawableDescriptor = {
    sdf: {
      shader: `
        uniform vec2 bodyCenters[BODY_COUNT];
        uniform float bodyRadii[BODY_COUNT];
        uniform float bodyColors[BODY_COUNT];
        uniform float bodySeeds[BODY_COUNT];
        uniform float bodyStyles[BODY_COUNT];
        uniform float bodyLitAngles[BODY_COUNT];

        float bodyNoise(vec2 p) {
          return sin(p.x) * sin(p.y);
        }

        vec3 bodySurfaceColor(
          int style,
          vec2 d,
          float radius,
          float seed,
          float litAngle,
          vec3 colorA,
          vec3 colorB
        ) {
          vec2 q = d / radius;
          float r01 = length(q);

          if (style == ${BodyStyle.sun}) {
            // Three drifting interference lattices; the first two sit at
            // nearby frequencies and slide in opposite directions, so the
            // convection cells continuously merge, split and boil instead of
            // gliding across the disc as one rigid pattern.
            float granules =
              0.8 * bodyNoise(q * 8.0 + vec2(seed, -seed * 0.6)) +
              0.55 * bodyNoise(q * 8.9 - vec2(seed * 0.8, seed * 1.1)) +
              0.45 * bodyNoise(q * 15.0 + vec2(seed * 1.4, -seed * 0.9));
            vec3 c = mix(vec3(1.4, 1.32, 1.1), colorA, smoothstep(0.0, 0.6, r01));
            c = mix(c, colorB, smoothstep(0.5, 1.0, r01 + granules * 0.15));
            return c * (1.0 + 0.2 * granules);
          }

          if (style == ${BodyStyle.star}) {
            return colorA * (3.75 + 1.75 * sin(seed));
          }

          // Every world shares one recipe: its surface coordinates rotate
          // with the body's spin (seed grows over time), so stripes and
          // blotches visibly roll around the disc, then a single field —
          // radial ripples for rings, stripes for the banded and ice giants,
          // blotches for everything rocky — mixes the two colours. The
          // terminator and limb shading below use the unrotated coordinates,
          // keeping the lighting locked to the sun while the surface turns.
          vec2 qr = vec2(
            q.x * cos(seed) - q.y * sin(seed),
            q.x * sin(seed) + q.y * cos(seed)
          );
          float field;
          if (style == ${BodyStyle.rings}) {
            field = sin(r01 * 26.0 + seed);
          } else if (style == ${BodyStyle.banded} || style == ${BodyStyle.ice}) {
            field = sin(qr.y * 5.0 + seed * 0.3);
          } else {
            field = bodyNoise(qr * 3.4) + 0.6 * bodyNoise(qr * 7.3 + vec2(2.7, 1.3));
          }
          vec3 c = mix(colorB, colorA, smoothstep(-0.6, 0.6, field));

          vec2 toSun = vec2(cos(litAngle), sin(litAngle));
          float dayside = smoothstep(-0.85, 0.55, dot(q / max(r01, 1e-4), toSun));
          c *= mix(0.22, 1.1, dayside);
          if (style != ${BodyStyle.rings}) {
            c *= 1.0 - 0.45 * smoothstep(0.5, 1.0, r01);
          }
          return c;
        }

        float bodyMinDistance(vec2 target, out vec4 color) {
          color = vec4(0.0, 0.0, 0.0, 1.0);
          float minDistance = 1000.0;

          for (int i = 0; i < BODY_COUNT; i++) {
            vec2 d = target - bodyCenters[i];
            float radius = max(bodyRadii[i], 1e-5);
            int style = int(bodyStyles[i] + 0.5);
            float seed = bodySeeds[i];
            float dist;

            if (style == ${BodyStyle.rings}) {
              float len = length(d);
              dist = min(
                abs(len - radius * 0.68) - radius * 0.1,
                abs(len - radius * 0.9) - radius * 0.06
              );
            } else {
              float angle = atan(d.y, d.x);
              float roughness = style == ${BodyStyle.sun}
                ? 0.5
                : style == ${BodyStyle.asteroid}
                ? 2.6
                : style == ${BodyStyle.rocky}
                ? 0.25
                : style == ${BodyStyle.moon}
                ? 0.35
                : 0.06;
              float wobble =
                sin(angle * 3.0 + seed) * 0.06 +
                sin(angle * 7.0 + seed * 1.7) * 0.04 +
                sin(angle * 17.0 - seed * 0.5) * 0.02;
              dist = length(d) - radius * (1.0 + wobble * roughness);
            }

            if (dist < minDistance) {
              minDistance = dist;
              float packedColor = bodyColors[i];
              float indexA = floor(packedColor / 32.0);
              vec3 colorA = readFromPalette(int(indexA + 0.5)).rgb;
              vec3 colorB = readFromPalette(int(packedColor - indexA * 32.0 + 0.5)).rgb;
              color = vec4(
                bodySurfaceColor(
                  style, d, radius, seed, bodyLitAngles[i], colorA, colorB
                ),
                1.0
              );
            }
          }

          return minDistance;
        }
      `,
      distanceFunctionName: 'bodyMinDistance',
    },
    propertyUniformMapping: {
      center: 'bodyCenters',
      radius: 'bodyRadii',
      colors: 'bodyColors',
      seed: 'bodySeeds',
      style: 'bodyStyles',
      litAngle: 'bodyLitAngles',
    },
    uniformCountMacroName: 'BODY_COUNT',
    shaderCombinationSteps: [0, 4, 8, 16, 32],
    empty: new Body(vec2.create(), 0, 'star', 0, 0, 0),
  };

  constructor(
    public center: vec2,
    public radius: number,
    public style: BodyStyleName,
    public colorA: number,
    public colorB: number,
    public seed: number,
    public litAngle = 0
  ) {
    super();
  }

  public minDistance(target: vec2): number {
    // Conservative: bound by the most outward the bumpiest outline can reach
    // so a body is never culled from a tile its surface might poke into.
    return vec2.dist(this.center, target) - this.radius * Body.MAX_OUTLINE_GROWTH;
  }

  protected getObjectToSerialize(transform2d: mat2d, transform1d: number): any {
    // litAngle is a world-space direction: push it through the linear part of
    // the transform so it survives the view mapping's scale and y-flip.
    const dx = Math.cos(this.litAngle);
    const dy = Math.sin(this.litAngle);

    return {
      center: vec2.transformMat2d(vec2.create(), this.center, transform2d),
      radius: this.radius * transform1d,
      colors: this.colorA * 32 + this.colorB,
      seed: this.seed,
      style: BodyStyle[this.style],
      litAngle: Math.atan2(
        transform2d[1] * dx + transform2d[3] * dy,
        transform2d[0] * dx + transform2d[2] * dy
      ),
    };
  }
}
