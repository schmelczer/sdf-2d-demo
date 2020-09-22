import { mat2d, vec2 } from 'gl-matrix';
import { Circle, Drawable, DrawableDescriptor } from 'sdf-2d';

export class Blob extends Drawable {
  public static descriptor: DrawableDescriptor = {
    sdf: {
      shader: `
        uniform vec2 headCenters[BLOB_COUNT];
        uniform vec2 leftFootCenters[BLOB_COUNT];
        uniform vec2 rightFootCenters[BLOB_COUNT];
        uniform float headRadii[BLOB_COUNT];
        uniform float footRadii[BLOB_COUNT];
        //uniform float ks[BLOB_COUNT];

        float smoothMin(float a, float b)
        {
          const float k = 80.0;
          float res = exp2( -k*a ) + exp2( -k*b );
          return -log2( res )/k;
        }

        float circleDistance(vec2 circleCenter, float radius) {
          return distance(position, circleCenter) - radius;
        }

        void blobMinDistance(inout float minDistance, inout float color) {
          for (int i = 0; i < BLOB_COUNT; i++) {
            float headDistance = circleDistance(headCenters[i], headRadii[i]);
            float leftFootDistance = circleDistance(leftFootCenters[i], footRadii[i]);
            float rightFootDistance = circleDistance(rightFootCenters[i], footRadii[i]);

            float res = min(
              smoothMin(headDistance, leftFootDistance),
              smoothMin(headDistance, rightFootDistance)
            );

            minDistance = min(minDistance, res);
            color = mix(1.0, color, step(distanceNdcPixelSize + SURFACE_OFFSET, res));
          }
        }
      `,
      distanceFunctionName: 'blobMinDistance',
    },
    propertyUniformMapping: {
      footRadius: 'footRadii',
      headRadius: 'headRadii',
      rightFootCenter: 'rightFootCenters',
      leftFootCenter: 'leftFootCenters',
      headCenter: 'headCenters',
    },
    uniformCountMacroName: 'BLOB_COUNT',
    shaderCombinationSteps: [1],
    empty: new Blob(vec2.fromValues(0, 0)),
  };

  public readonly boundingCircleRadius = 200;

  protected readonly headRadius = 50;
  protected readonly footRadius = 20;

  private readonly headOffset = vec2.fromValues(0, 80);

  private readonly leftFootOffsetDefault = vec2.fromValues(-20, this.footRadius);
  private readonly rightFootOffsetDefault = vec2.fromValues(20, this.footRadius);

  private leftFootOffset = vec2.create();
  private rightFootOffset = vec2.create();

  protected boundingCircle = new Circle(vec2.create(), this.boundingCircleRadius);
  protected head = new Circle(vec2.create(), this.headRadius);
  protected leftFoot = new Circle(vec2.create(), this.footRadius);
  protected rightFoot = new Circle(vec2.create(), this.footRadius);

  public constructor(private center: vec2) {
    super();
    this.position = center;
  }

  public set position(value: vec2) {
    vec2.copy(this.boundingCircle.center, value);
    vec2.add(this.head.center, value, this.headOffset);
    vec2.add(this.leftFoot.center, value, this.leftFootOffset);
    vec2.add(this.rightFoot.center, value, this.rightFootOffset);
  }

  public animate(time: number) {
    const offset = 15;
    const q = (time % 1000) / 500;

    vec2.subtract(
      this.rightFootOffset,
      this.rightFootOffsetDefault,
      vec2.fromValues(q * offset, 0)
    );

    vec2.subtract(
      this.leftFootOffset,
      this.leftFootOffsetDefault,
      vec2.fromValues(q * offset, 0)
    );

    vec2.add(
      this.rightFootOffset,
      this.rightFootOffset,
      vec2.fromValues(
        Math.min(1, q) * offset * 2,
        Math.sin(Math.min(1, q) * Math.PI) * 10
      )
    );

    vec2.add(
      this.leftFootOffset,
      this.leftFootOffset,
      vec2.fromValues(
        (q > 1 ? q - 1 : 0) * offset * 2,
        Math.sin((q > 1 ? q - 1 : 0) * Math.PI) * 10
      )
    );

    this.position = this.center;
  }

  public minDistance(target: vec2): number {
    return this.boundingCircle.minDistance(target);
  }

  protected getObjectToSerialize(transform2d: mat2d, transform1d: number): any {
    return {
      headCenter: vec2.transformMat2d(vec2.create(), this.head.center, transform2d),
      leftFootCenter: vec2.transformMat2d(
        vec2.create(),
        this.leftFoot.center,
        transform2d
      ),
      rightFootCenter: vec2.transformMat2d(
        vec2.create(),
        this.rightFoot.center,
        transform2d
      ),
      headRadius: this.headRadius * transform1d,
      footRadius: this.footRadius * transform1d,
    };
  }
}
