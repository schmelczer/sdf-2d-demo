import { vec2 } from 'gl-matrix';
import { Flashlight, Renderer, rgb, rgb255, runAnimation } from 'sdf-2d';
import { prettyPrint } from '../../helper/pretty-print';
import { Random } from '../../helper/random';
import { settings } from '../../settings';
import { Scene } from '../scene';
import { Metaball, MetaCircle } from './metaball';

export class MetaballScene implements Scene {
  private circles: Array<Metaball> = [];

  private canvas: HTMLCanvasElement;
  private overlay: HTMLDivElement;
  public renderer?: Renderer;

  public async run(canvas: HTMLCanvasElement, overlay: HTMLDivElement): Promise<void> {
    this.canvas = canvas;
    this.overlay = overlay;

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

    await runAnimation(
      canvas,
      [
        {
          ...Flashlight.descriptor,
          shaderCombinationSteps: [0, 2],
        },
        {
          ...MetaCircle.descriptor,
          shaderCombinationSteps: [0, 1, 2, 4, 8, 12, 16],
        },
      ],
      this.drawNextFrame.bind(this),
      {},
      {
        ambientLight: rgb(0.1, 0.1, 0.3),
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
    const viewAreaWidth = width / Math.max(width, height);
    const viewAreaHeight = height / Math.max(width, height);
    renderer.setViewArea(
      vec2.fromValues(0, viewAreaHeight),
      vec2.fromValues(viewAreaWidth, viewAreaHeight)
    );

    this.overlay.innerText = prettyPrint(renderer.insights);

    this.circles.forEach((c) => {
      c.animate(currentTime / 2000, viewAreaWidth, viewAreaHeight);
      renderer.addDrawable(c.shape);
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

    renderer.addDrawable(light1);
    renderer.addDrawable(light2);

    return currentTime < settings.sceneTimeInMilliseconds;
  }
}
