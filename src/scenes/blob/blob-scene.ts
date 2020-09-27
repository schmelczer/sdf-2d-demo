import { vec2 } from 'gl-matrix';
import { Circle, CircleLight, compile, Renderer } from 'sdf-2d';
import { prettyPrint } from '../../helper/pretty-print';
import { rgb } from '../../helper/rgb';
import { rgb255 } from '../../helper/rgb255';
import { Scene } from '../scene';
import { Blob } from './blob';

export class BlobScene implements Scene {
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
      Circle.descriptor,
      {
        ...CircleLight.descriptor,
        shaderCombinationSteps: [0, 1, 2],
      },
      Blob.descriptor,
    ]);

    this.renderer.setRuntimeSettings({
      ambientLight: rgb255(89, 25, 115),
      colorPalette: [
        rgb255(0, 0, 0),
        rgb255(119, 143, 120),
        rgb255(119, 143, 120),
        rgb255(224, 96, 126),
      ],
    });

    const { width, height } = this.canvas.getBoundingClientRect();
    const length = vec2.length([width, height]);

    this.blob = new Blob([width / 2, -length / 4 + length / 2]);
  }

  private blob: Blob;

  private deltaSinceStart = 0;
  public drawNextFrame(
    currentTime: DOMHighResTimeStamp,
    deltaTime: DOMHighResTimeStamp
  ): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.deltaSinceStart += deltaTime;
    this.renderer.setViewArea([0, height], [width, height]);

    this.renderer.autoscaleQuality(deltaTime);
    this.overlay.innerText = prettyPrint(this.renderer.insights);

    const length = vec2.length([width, height]);

    const q = (this.deltaSinceStart % 8000) / 4300;
    this.blob.animate(this.deltaSinceStart);
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
    ].forEach((d) => this.renderer.addDrawable(d));

    this.renderer.renderDrawables();
  }

  public destroy(): void {
    this.renderer.destroy();
  }
}
