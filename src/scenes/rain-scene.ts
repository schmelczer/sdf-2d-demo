import { vec2, vec3 } from 'gl-matrix';
import { CircleLight, Drawable, DrawableDescriptor, Tunnel } from 'sdf-2d';
import { Random } from '../helper/random';
import { Scene } from './scene';

export class RainScene implements Scene {
  public droplets: Array<Droplet> = [];

  private light1: CircleLight = new CircleLight(
    vec2.create(),
    1,
    vec3.fromValues(1, 0, 1),
    1
  );

  private light2: CircleLight = new CircleLight(
    vec2.create(),
    1,
    vec3.fromValues(1, 0, 0.5),
    1
  );

  public constructor() {
    for (let i = 0; i < 20; i++) {
      this.droplets.push(new Droplet());
    }
  }

  public get descriptors(): Array<DrawableDescriptor> {
    return [Tunnel.descriptor, CircleLight.descriptor];
  }

  public animate(
    currentTime: number,
    viewAreaSize: { width: number; height: number }
  ): void {
    vec2.set(this.light1.center, 0, viewAreaSize.height / 2);
    vec2.set(this.light2.center, viewAreaSize.width, viewAreaSize.height / 2);
    this.droplets.forEach((d) => d.animate(currentTime, viewAreaSize));
  }

  public get drawables(): Array<Drawable> {
    return [...this.droplets.map((d) => d.drawable), this.light1, this.light2];
  }
}

class Droplet {
  public readonly drawable: Tunnel;

  private speed = Random.getRandom() * 0.2 + 0.2;
  private position = vec2.fromValues(
    Random.getRandomInRange(0.1, 0.9),
    Random.getRandom()
  );
  private length = Random.getRandom() * 20 + 4;

  constructor() {
    const size = Random.getRandom() * 2 + 2;

    this.drawable = new Tunnel(
      vec2.create(),
      vec2.create(),
      size + Random.getRandom() * 2 + 2,
      size
    );
  }

  public animate(
    currentTime: number,
    { width, height }: { width: number; height: number }
  ) {
    const heightOffset = 100;
    vec2.set(
      this.drawable.from,
      this.position[0] * width,
      height -
        ((this.position[1] * height + this.speed * currentTime) % (height + heightOffset))
    );

    vec2.add(this.drawable.to, this.drawable.from, vec2.fromValues(0, this.length));
  }
}
