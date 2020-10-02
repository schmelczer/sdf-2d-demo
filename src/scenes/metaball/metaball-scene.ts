import { vec2 } from 'gl-matrix';
import { compile, Flashlight, MetaCircle, Renderer } from 'sdf-2d';
import { prettyPrint } from '../../helper/pretty-print';
import { Random } from '../../helper/random';
import { rgb } from '../../helper/rgb';
import { rgb255 } from '../../helper/rgb255';
import { Scene } from '../scene';
import { Metaball } from './metaball';

export class MetaballScene implements Scene {
  private circles: Array<Metaball> = [];

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
        ...Flashlight.descriptor,
        shaderCombinationSteps: [0, 2],
      },
      {
        ...MetaCircle.descriptor,
        shaderCombinationSteps: [0, 1, 2, 4, 8, 12, 16],
      },
    ]);

    this.renderer.setRuntimeSettings({
      ambientLight: rgb(0.1, 0.1, 0.3),
      colorPalette: [
        rgb(1, 1, 1),
        rgb(1, 1, 1),
        rgb(1, 1, 1),
        rgb(1, 1, 1),
        rgb(1, 1, 0),
        rgb255(186, 59, 70),
      ],
    });

    for (let i = 0; i < 16; i++) {
      this.circles.push(
        new Metaball(
          vec2.fromValues(
            Random.getRandomInRange(0.3, 0.6),
            Random.getRandomInRange(0.3, 0.6)
          ),
          vec2.fromValues(
            Random.getRandomInRange(0.05, 0.5),
            Random.getRandomInRange(0.05, 0.5)
          )
        )
      );
    }
  }

  public drawNextFrame(
    currentTime: DOMHighResTimeStamp,
    deltaTime: DOMHighResTimeStamp
  ): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const viewAreaWidth = width / Math.max(width, height);
    const viewAreaHeight = height / Math.max(width, height);
    this.renderer.setViewArea(
      vec2.fromValues(0, viewAreaHeight),
      vec2.fromValues(viewAreaWidth, viewAreaHeight)
    );
    this.renderer.autoscaleQuality(deltaTime);

    this.overlay.innerText = prettyPrint(this.renderer.insights);

    this.circles.forEach((c) => {
      c.animate(currentTime / 2000, viewAreaWidth, viewAreaHeight);
      this.renderer.addDrawable(c.shape);
    });

    const light1 = new Flashlight(
      vec2.fromValues(-0.05, -0.05),
      rgb255(104, 171, 212),
      0.02,
      vec2.fromValues(1, 1)
    );
    const light2 = new Flashlight(
      vec2.fromValues(viewAreaWidth + 0.05, -0.05),
      rgb255(226, 90, 102),
      0.02,
      vec2.fromValues(-1, 1)
    );

    this.renderer.addDrawable(light1);
    this.renderer.addDrawable(light2);

    this.renderer.renderDrawables();
  }

  public destroy(): void {
    this.renderer.destroy();
  }
}
