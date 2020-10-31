import { ReadonlyVec2, vec2 } from 'gl-matrix';
import { DropletFactory, rgb255 } from 'sdf-2d';
import { Random } from '../../helper/random';

export const Droplet = DropletFactory(rgb255(122, 122, 255));
export class DropletWrapper {
  public readonly drawable: InstanceType<typeof Droplet>;

  private speed = Random.getRandom() * 0.2 + 0.2;
  private position = vec2.fromValues(
    Random.getRandomInRange(0.1, 0.9),
    Random.getRandom()
  );
  private length = Random.getRandom() * 20 + 4;

  constructor() {
    const size = Random.getRandom() * 2 + 2;

    this.drawable = new Droplet(
      vec2.create(),
      vec2.create(),
      size + Random.getRandom() * 2 + 2,
      size
    );
  }

  public animate(currentTime: number, viewAreaSize: ReadonlyVec2) {
    const heightOffset = 100;
    vec2.set(
      this.drawable.from,
      this.position.x * viewAreaSize.x,
      viewAreaSize.y -
        ((this.position.y * viewAreaSize.y + this.speed * currentTime) %
          (viewAreaSize.y + heightOffset))
    );

    vec2.add(this.drawable.to, this.drawable.from, vec2.fromValues(0, this.length));
  }
}
