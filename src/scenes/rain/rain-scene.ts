import { vec2, vec3 } from 'gl-matrix';
import { CircleLight, compile, Renderer, Tunnel } from 'sdf-2d';
import { Scene } from '../scene';
import { Droplet } from './droplet';

export class RainScene implements Scene {
  private droplets: Array<Droplet> = [];
  private light1: CircleLight = new CircleLight(
    vec2.create(),
    vec3.fromValues(1, 0, 1),
    1
  );
  private light2: CircleLight = new CircleLight(
    vec2.create(),
    vec3.fromValues(1, 0, 0.5),
    1
  );

  private renderer: Renderer;
  private canvas: HTMLCanvasElement;
  private overlay: HTMLDivElement;

  public constructor() {
    for (let i = 0; i < 40; i++) {
      this.droplets.push(new Droplet());
    }
  }

  public async initialize(
    canvas: HTMLCanvasElement,
    overlay: HTMLDivElement
  ): Promise<void> {
    this.canvas = canvas;
    this.overlay = overlay;
    this.renderer = await compile(
      canvas,
      [
        {
          ...Tunnel.descriptor,
          shaderCombinationSteps: [0, 1, 2, 4, 8, 12, 16, 24],
        },
        {
          ...CircleLight.descriptor,
          shaderCombinationSteps: [2],
        },
      ],
      [vec3.fromValues(0.4, 1, 0.6), vec3.fromValues(1, 1, 0), vec3.fromValues(0.3, 1, 1)]
    );

    this.renderer.setRuntimeSettings({
      ambientLight: vec3.fromValues(0.45, 0.25, 0.45),
      tileMultiplier: 10,
    });
  }

  public drawNextFrame(
    currentTime: DOMHighResTimeStamp,
    deltaTime: DOMHighResTimeStamp
  ): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.renderer.setViewArea(vec2.fromValues(0, height), vec2.fromValues(width, height));
    this.renderer.autoscaleQuality(deltaTime);

    this.overlay.innerText = JSON.stringify(
      this.renderer.insights,
      (_, v) => (v.toFixed ? Number(v.toFixed(2)) : v),
      '  '
    );

    const viewAreaSize = this.renderer.viewAreaSize;

    vec2.set(this.light1.center, 0, viewAreaSize.y / 2);
    vec2.set(this.light2.center, viewAreaSize.x, viewAreaSize.y / 2);

    this.droplets.forEach((d) => d.animate(currentTime, viewAreaSize));

    [...this.droplets.map((d) => d.drawable), this.light1, this.light2].forEach((d) =>
      this.renderer.addDrawable(d)
    );

    this.renderer.renderDrawables();
  }

  public destroy(): void {
    this.renderer.destroy();
  }
}
