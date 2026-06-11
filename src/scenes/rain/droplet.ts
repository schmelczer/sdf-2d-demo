import { ReadonlyVec2, vec2 } from 'gl-matrix';
import { DropletFactory, rgb255 } from 'sdf-2d';
import { Random } from '../../helper/random';

export const Droplet = DropletFactory(rgb255(122, 122, 255));
export class DropletWrapper {
  public readonly drawable: InstanceType<typeof Droplet>;

  private speed = Random.getRandom() * 0.45 + 0.45;
  private position = vec2.fromValues(
    Random.getRandomInRange(0.1, 0.9),
    Random.getRandom()
  );
  private length = Random.getRandom() * 14 + 8;

  constructor() {
    const size = Random.getRandom() * 1.2 + 1;

    this.drawable = new Droplet(
      vec2.create(),
      vec2.create(),
      size + Random.getRandom() + 1,
      size
    );
  }

  public animate(currentTime: number, viewAreaSize: ReadonlyVec2, windSlant: number) {
    const heightOffset = 100;
    const fall = this.speed * currentTime;

    vec2.set(
      this.drawable.from,
      (this.position.x * viewAreaSize.x + fall * windSlant) % viewAreaSize.x,
      viewAreaSize.y -
        ((this.position.y * viewAreaSize.y + fall) % (viewAreaSize.y + heightOffset))
    );

    // the tail points opposite to the direction of motion
    const norm = this.length / Math.sqrt(1 + windSlant * windSlant);
    vec2.add(
      this.drawable.to,
      this.drawable.from,
      vec2.fromValues(-windSlant * norm, norm)
    );
  }
}
