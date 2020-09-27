import { vec2 } from 'gl-matrix';
import { CircleLight, compile, Renderer, Tunnel } from 'sdf-2d';
import { prettyPrint } from '../../helper/pretty-print';
import { rgb } from '../../helper/rgb';
import { rgb255 } from '../../helper/rgb255';
import { Scene } from '../scene';
import { Droplet } from './droplet';

export class RainScene implements Scene {
  private droplets: Array<Droplet> = [];
  private light1: CircleLight = new CircleLight(vec2.create(), rgb255(184, 41, 255), 2);
  private light2: CircleLight = new CircleLight(vec2.create(), rgb255(255, 31, 109), 2);

  private renderer: Renderer;
  private canvas: HTMLCanvasElement;
  private overlay: HTMLDivElement;

  public async initialize(
    canvas: HTMLCanvasElement,
    overlay: HTMLDivElement
  ): Promise<void> {
    this.canvas = canvas;
    this.overlay = overlay;
    this.renderer = await compile(canvas, [
      {
        ...Tunnel.descriptor,
        shaderCombinationSteps: [0, 1, 2, 4, 8, 12, 16, 24],
      },
      {
        ...CircleLight.descriptor,
        shaderCombinationSteps: [2],
      },
    ]);

    this.renderer.setRuntimeSettings({
      ambientLight: rgb(0.2, 0.2, 0.2),
      backgroundColor: rgb(1, 1, 1),
      colorPalette: [rgb(1, 1, 1), rgb(0.3, 1, 1), rgb(1, 1, 0), rgb(0.3, 1, 1)],
    });

    for (let i = 0; i < (canvas.getBoundingClientRect().width / 800) * 20; i++) {
      this.droplets.push(new Droplet());
    }
  }

  public drawNextFrame(
    currentTime: DOMHighResTimeStamp,
    deltaTime: DOMHighResTimeStamp
  ): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.renderer.setViewArea(vec2.fromValues(0, height), vec2.fromValues(width, height));
    this.renderer.autoscaleQuality(deltaTime);
    this.overlay.innerText = prettyPrint(this.renderer.insights);

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
