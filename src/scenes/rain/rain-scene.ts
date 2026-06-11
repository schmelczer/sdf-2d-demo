import { vec2 } from 'gl-matrix';
import { CircleLight, Renderer, rgb, rgb255, runAnimation } from 'sdf-2d';
import { prettyPrint } from '../../helper/pretty-print';
import { settings } from '../../settings';
import { Scene } from '../scene';
import { Droplet, DropletWrapper } from './droplet';

const WIND_SLANT = 0.2;

export class RainScene implements Scene {
  private droplets: Array<DropletWrapper> = [];
  private lights = [
    new CircleLight(vec2.create(), rgb255(184, 41, 255), 1.5),
    new CircleLight(vec2.create(), rgb255(255, 31, 109), 1.5),
    new CircleLight(vec2.create(), rgb255(64, 110, 255), 1.5),
  ];

  private overlay: HTMLDivElement;
  public insights?: any;

  public async run(canvas: HTMLCanvasElement, overlay: HTMLDivElement): Promise<void> {
    this.overlay = overlay;
    for (
      let i = 0;
      i < Math.max(100, (canvas.getBoundingClientRect().width / 800) * 100);
      i++
    ) {
      this.droplets.push(new DropletWrapper());
    }

    await runAnimation(
      canvas,
      [
        {
          ...Droplet.descriptor,
          // Tiles that contain more droplets than the largest step have no
          // compiled shader to fall back on and flicker; together with the
          // raised tileMultiplier, 48 keeps the worst-case tile comfortably
          // covered.
          shaderCombinationSteps: [0, 2, 4, 8, 16, 32, 48],
        },
        {
          ...CircleLight.descriptor,
          shaderCombinationSteps: [0, 3],
        },
      ],
      this.drawNextFrame.bind(this),
      {
        backgroundColor: rgb(0.5, 0.5, 0.5),
        ambientLight: rgb(0.2, 0.2, 0.23),
        enableHighDpiRendering: true,
        // More, smaller tiles keep the droplet count per tile low.
        tileMultiplier: 12,
      }
    );
  }

  private drawNextFrame(
    renderer: Renderer,
    currentTime: DOMHighResTimeStamp,
    _: DOMHighResTimeStamp
  ): boolean {
    this.insights = renderer.insights;

    const width = renderer.canvasSize.x;
    const height = renderer.canvasSize.y;

    renderer.setViewArea(vec2.fromValues(0, height), vec2.fromValues(width, height));
    this.overlay.innerText = prettyPrint(renderer.insights);

    const viewAreaSize = renderer.viewAreaSize;

    // each light sweeps within its own third of the screen
    this.lights.forEach((light, i) => {
      vec2.set(
        light.center,
        viewAreaSize.x *
          ((i + 0.5) / 3 + (1 / 6) * Math.sin(currentTime / 900 + (i * Math.PI * 2) / 3)),
        0
      );
    });

    this.droplets.forEach((d) => d.animate(currentTime, viewAreaSize, WIND_SLANT));

    [...this.droplets.map((d) => d.drawable), ...this.lights].forEach((d) =>
      renderer.addDrawable(d)
    );

    return currentTime < settings.sceneTimeInMilliseconds;
  }
}
