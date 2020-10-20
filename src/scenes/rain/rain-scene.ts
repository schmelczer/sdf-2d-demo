import { vec2 } from 'gl-matrix';
import { CircleLight, Renderer, rgb, rgb255, runAnimation } from 'sdf-2d';
import { prettyPrint } from '../../helper/pretty-print';
import { settings } from '../../settings';
import { Scene } from '../scene';
import { Droplet, DropletWrapper } from './droplet';

export class RainScene implements Scene {
  private droplets: Array<DropletWrapper> = [];
  private light1: CircleLight = new CircleLight(vec2.create(), rgb255(184, 41, 255), 2);
  private light2: CircleLight = new CircleLight(vec2.create(), rgb255(255, 31, 109), 2);

  private canvas: HTMLCanvasElement;
  private overlay: HTMLDivElement;
  public renderer?: Renderer;

  public async run(canvas: HTMLCanvasElement, overlay: HTMLDivElement): Promise<void> {
    this.canvas = canvas;
    this.overlay = overlay;
    for (let i = 0; i < (canvas.getBoundingClientRect().width / 800) * 20; i++) {
      this.droplets.push(new DropletWrapper());
    }

    await runAnimation(
      canvas,
      [
        {
          ...Droplet.descriptor,
          shaderCombinationSteps: [0, 1, 2, 4, 8, 12, 16, 24],
        },
        {
          ...CircleLight.descriptor,
          shaderCombinationSteps: [0, 2],
        },
      ],
      this.drawNextFrame.bind(this),
      {},
      {
        ambientLight: rgb(0.2, 0.2, 0.2),
        enableHighDpiRendering: true,
      }
    );
  }

  private drawNextFrame(
    renderer: Renderer,
    currentTime: DOMHighResTimeStamp,
    deltaTime: DOMHighResTimeStamp
  ): boolean {
    this.renderer = renderer;

    const { width, height } = this.canvas.getBoundingClientRect();
    renderer.setViewArea(vec2.fromValues(0, height), vec2.fromValues(width, height));
    this.overlay.innerText = prettyPrint(renderer.insights);

    const viewAreaSize = renderer.viewAreaSize;

    vec2.set(this.light1.center, 0, viewAreaSize.y / 2);
    vec2.set(this.light2.center, viewAreaSize.x, viewAreaSize.y / 2);

    this.droplets.forEach((d) => d.animate(currentTime, viewAreaSize));

    [...this.droplets.map((d) => d.drawable), this.light1, this.light2].forEach((d) =>
      renderer.addDrawable(d)
    );

    return currentTime < settings.sceneTimeInMilliseconds;
  }
}
