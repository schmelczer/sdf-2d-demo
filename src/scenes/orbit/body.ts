import { mat2d, vec2 } from 'gl-matrix';
import { Drawable, DrawableDescriptor } from 'sdf-2d';

/**
 * A rocky celestial body: a circle whose radius is modulated by a few angular
 * harmonics so its outline looks bumpy. One descriptor renders every body in
 * the scene (sun, planets, asteroids) — each instance carries its own palette
 * colour, size, surface `seed` (rotate it over time to make the body spin) and
 * `roughness` (how jagged the outline is: ~0.5 for a planet, ~2.5 for an
 * asteroid).
 */
export class Body extends Drawable {
  // The peak fraction by which the harmonics below can push the outline
  // outward (0.06 + 0.04 + 0.02), used for a conservative culling bound.
  private static readonly MAX_WOBBLE = 0.12;

  public static descriptor: DrawableDescriptor = {
    sdf: {
      shader: `
        uniform vec2 bodyCenters[BODY_COUNT];
        uniform float bodyRadii[BODY_COUNT];
        uniform float bodyColorIndices[BODY_COUNT];
        uniform float bodySeeds[BODY_COUNT];
        uniform float bodyRoughness[BODY_COUNT];

        float bodyMinDistance(vec2 target, out vec4 color) {
          color = readFromPalette(0);
          float minDistance = 1000.0;

          for (int i = 0; i < BODY_COUNT; i++) {
            vec2 d = target - bodyCenters[i];
            float angle = atan(d.y, d.x);
            float seed = bodySeeds[i];

            float wobble =
              sin(angle * 3.0 + seed) * 0.06 +
              sin(angle * 7.0 + seed * 1.7) * 0.04 +
              sin(angle * 17.0 - seed * 0.5) * 0.02;

            float dist =
              length(d) - bodyRadii[i] * (1.0 + wobble * bodyRoughness[i]);

            if (dist < minDistance) {
              minDistance = dist;
              color = readFromPalette(int(bodyColorIndices[i] + 0.5));
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
      colorIndex: 'bodyColorIndices',
      seed: 'bodySeeds',
      roughness: 'bodyRoughness',
    },
    uniformCountMacroName: 'BODY_COUNT',
    shaderCombinationSteps: [0, 4, 8, 16, 32],
    empty: new Body(vec2.create(), 0, 0, 0, 0),
  };

  constructor(
    public center: vec2,
    public radius: number,
    public colorIndex: number,
    public seed: number,
    public roughness: number
  ) {
    super();
  }

  public minDistance(target: vec2): number {
    // Conservative: bound by the most outward the bumpy outline can reach so a
    // body is never culled from a tile its surface might poke into.
    return (
      vec2.dist(this.center, target) -
      this.radius * (1 + Body.MAX_WOBBLE * this.roughness)
    );
  }

  protected getObjectToSerialize(transform2d: mat2d, transform1d: number): any {
    return {
      center: vec2.transformMat2d(vec2.create(), this.center, transform2d),
      radius: this.radius * transform1d,
      colorIndex: this.colorIndex,
      seed: this.seed,
      roughness: this.roughness,
    };
  }
}
