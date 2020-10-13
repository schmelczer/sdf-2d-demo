import { vec2 } from 'gl-matrix';
import { MetaCircleFactory } from 'sdf-2d';
import { Random } from '../../helper/random';

export const MetaCircle = MetaCircleFactory(5);

export class Metaball {
  public shape = new MetaCircle(vec2.create(), Random.getRandomInRange(0.025, 0.075));

  private direction = Random.getRandom() > 0.5 ? 1 : -1;
  private speed = Random.getRandomInRange(0.5, 2);
  constructor(private readonly center: vec2, private readonly size: vec2) {}

  public animate(currentTime: DOMHighResTimeStamp, width: number, height: number) {
    vec2.set(
      this.shape.center,
      this.size.x * Math.cos(currentTime * this.speed * this.direction) +
        this.center.x * width,
      this.size.y * Math.sin(currentTime * this.speed * this.direction) +
        this.center.y * height
    );
  }
}
