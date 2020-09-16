import { vec2 } from 'gl-matrix';
import { CircleLight, Drawable, DrawableDescriptor, Flashlight, Tunnel } from 'sdf-2d';
import { Random } from '../helper/random';
import { Scene } from './scene';

export class RainScene implements Scene {
  public droplets: Array<Droplet> = [];

  public constructor() {
    for (let i = 0; i < 100; i++) {
      this.droplets.push(new Droplet());
    }
  }

  public get descriptors(): Array<DrawableDescriptor> {
    return [Tunnel.descriptor, CircleLight.descriptor, Flashlight.descriptor];
  }

  public animate(
    currentTime: number,
    viewAreaSize: { width: number; height: number }
  ): void {
    this.droplets.forEach((d) => d.animate(currentTime, viewAreaSize));
  }

  public get drawables(): Array<Drawable> {
    return this.droplets.map((d) => d.drawable);
  }
}

class Droplet {
  public readonly drawable: Tunnel;

  private speed = Random.getRandom() * 0.2 + 0.1;
  private position = vec2.fromValues(Random.getRandom(), Random.getRandom());
  private length = Random.getRandom() * 30 + 8;

  constructor() {
    const size = Random.getRandom() * 10 + 5;

    this.drawable = new Tunnel(
      vec2.create(),
      vec2.create(),
      size + Random.getRandom() * 5 + 5,
      size
    );
  }

  public animate(
    currentTime: number,
    { width, height }: { width: number; height: number }
  ) {
    const heightOffset = 300;
    vec2.set(
      this.drawable.from,
      this.position[0] * width,
      height - ((this.speed * currentTime) % (height + heightOffset))
    );

    vec2.add(this.drawable.to, this.drawable.from, vec2.fromValues(0, this.length));
  }
}
