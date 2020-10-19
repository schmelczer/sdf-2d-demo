import { vec2 } from 'gl-matrix';
import { CircleFactory, CircleLight, Renderer, rgb, rgb255, runAnimation } from 'sdf-2d';
import { prettyPrint } from '../../helper/pretty-print';
import { settings } from '../../settings';
import { Scene } from '../scene';
import { Blob } from './blob';

const Circle = CircleFactory(rgb255(119, 143, 120));

export class BlobScene implements Scene {
  private canvas: HTMLCanvasElement;
  private overlay: HTMLDivElement;

  public async run(canvas: HTMLCanvasElement, overlay: HTMLDivElement): Promise<void> {
    this.canvas = canvas;
    this.overlay = overlay;

    const { width, height } = this.canvas.getBoundingClientRect();
    const length = vec2.length([width, height]);

    this.blob = new Blob([width / 2, -length / 4 + length / 2]);

    await runAnimation(
      canvas,
      [
        Circle.descriptor,
        {
          ...CircleLight.descriptor,
          shaderCombinationSteps: [0, 1, 2],
        },
        Blob.descriptor,
      ],
      this.drawNextFrame.bind(this),
      {},
      {
        ambientLight: rgb255(89, 25, 115),
        enableHighDpiRendering: true,
        colorPalette: [
          rgb255(0, 0, 0),
          rgb255(119, 143, 120),
          rgb255(119, 143, 120),
          rgb255(224, 96, 126),
        ],
      }
    );
  }

  private blob: Blob;

  private drawNextFrame(
    renderer: Renderer,
    currentTime: DOMHighResTimeStamp,
    deltaTime: DOMHighResTimeStamp
  ): boolean {
    const { width, height } = this.canvas.getBoundingClientRect();
    renderer.setViewArea([0, height], [width, height]);

    this.overlay.innerText = prettyPrint(renderer.insights);

    const length = vec2.length([width, height]);

    const q = (currentTime % 8000) / 4300;
    this.blob.animate(currentTime);
    [
      new Circle([width / 2, -length / 4], length / 2),
      this.blob,
      new CircleLight(
        [
          (Math.cos((1 - q) * Math.PI) * length) / 2 + width / 2,
          (Math.sin((1 - q) * Math.PI) * length) / 2,
        ],
        rgb(1, 0.8, 0),
        1
      ),
      new CircleLight(
        [
          (Math.cos(-q * Math.PI) * length) / 2 + width / 2,
          (Math.sin(-q * Math.PI) * length) / 2,
        ],
        rgb(0, 0.8, 1),
        1
      ),
    ].forEach((d) => renderer.addDrawable(d));

    return currentTime < settings.sceneTimeInMilliseconds;
  }
}
