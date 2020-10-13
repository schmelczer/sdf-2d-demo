import { vec2 } from 'gl-matrix';

export class Circle {
  constructor(public center: vec2, public radius: number) {}

  public distance(target: vec2): number {
    return vec2.distance(this.center, target) - this.radius;
  }

  public distanceBetween(target: Circle): number {
    return vec2.distance(target.center, this.center) - this.radius - target.radius;
  }
}
