import { vec2 } from 'gl-matrix';
import { CircleLight, Renderer, rgb, rgb255, runAnimation } from 'sdf-2d';
import { prettyPrint } from '../../helper/pretty-print';
import { settings } from '../../settings';
import { Scene } from '../scene';
import { Droplet, DropletWrapper } from './droplet';

const WIND_SLANT = 0.2;

export class RainScene implements Scene {
  private droplets: Array<DropletWrapper> = [];
  // The moon: a single pale, cold light hanging high in the sky and the scene's
  // only light source — the falling rain only shows where its streaks catch it.
  private moon = new CircleLight(vec2.create(), rgb255(200, 214, 255), 2.5);

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
          shaderCombinationSteps: [0, 1],
        },
      ],
      this.drawNextFrame.bind(this),
      {
        // A dark night sky so the moon is the dominant light.
        backgroundColor: rgb(0.09, 0.12, 0.19),
        ambientLight: rgb(0.2, 0.22, 0.28),
        enableHighDpiRendering: true,
        // Keep most of the previous frame each render so the droplets smear
        // into long streaks of rain.
        motionBlur: 0.9,
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

    // The moon drifts back and forth along the top edge; the rain falls past
    // it and lights up.
    vec2.set(
      this.moon.center,
      viewAreaSize.x * (0.5 + 0.5 * Math.sin(currentTime / 2500)),
      viewAreaSize.y * 0.95
    );

    this.droplets.forEach((d) => d.animate(currentTime, viewAreaSize, WIND_SLANT));

    [...this.droplets.map((d) => d.drawable), this.moon].forEach((d) =>
      renderer.addDrawable(d)
    );

    return currentTime < settings.sceneTimeInMilliseconds;
  }
}
