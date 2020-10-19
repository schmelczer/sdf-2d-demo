import { vec2, vec3 } from 'gl-matrix';
import {
  CircleLight,
  FilteringOptions,
  InvertedTunnelFactory,
  Renderer,
  renderNoise,
  rgb,
  runAnimation,
  WrapOptions,
} from 'sdf-2d';
import { clamp } from '../helper/clamp';
import { last } from '../helper/last';
import { prettyPrint } from '../helper/pretty-print';
import { Random } from '../helper/random';
import { settings } from '../settings';
import { Scene } from './scene';

const InvertedTunnel = InvertedTunnelFactory(3);

export class TunnelScene implements Scene {
  private canvas: HTMLCanvasElement;
  private overlay: HTMLDivElement;

  private tunnels: Array<InstanceType<typeof InvertedTunnel>> = [];
  private lights: Array<CircleLight> = [];

  private generateTunnel() {
    const canvasSize = this.canvas.getBoundingClientRect();

    let previousEnd = vec2.fromValues(0, 200);
    let previousRadius = 50;

    if (this.tunnels.length > 0) {
      previousEnd = last(this.tunnels).to;
      previousRadius = last(this.tunnels).toRadius;
    }

    let height =
      previousEnd.y +
      Random.getRandomInRange(-canvasSize.height / 3, canvasSize.height / 3);

    height = clamp(
      height,
      canvasSize.height / 6 + 50,
      canvasSize.height - canvasSize.height / 6 + 50
    );

    const currentEnd = vec2.fromValues(this.tunnels.length * 300, height);
    const currentToRadius = (Random.getRandom() * canvasSize.height) / 6 + 50;

    this.tunnels.push(
      new InvertedTunnel(previousEnd, currentEnd, previousRadius, currentToRadius)
    );

    if (this.tunnels.length % 4 == 0) {
      this.lights.push(
        new CircleLight(
          previousEnd,
          vec3.normalize(vec3.create(), [
            Random.getRandom(),
            Random.getRandom(),
            Random.getRandom(),
          ]),
          0.25
        )
      );
    }
  }

  public async run(canvas: HTMLCanvasElement, overlay: HTMLDivElement): Promise<void> {
    const noiseTexture = await renderNoise([1024, 1], 15, 1);

    this.canvas = canvas;
    this.overlay = overlay;

    for (let i = 0; i < 200; i++) {
      this.generateTunnel();
    }

    await runAnimation(
      canvas,
      [
        {
          ...InvertedTunnel.descriptor,
          shaderCombinationSteps: [0, 1, 2, 4, 8, 12],
        },
        {
          ...CircleLight.descriptor,
          shaderCombinationSteps: [0, 1, 2, 3, 4, 5, 6, 7],
        },
      ],
      this.drawNextFrame.bind(this),
      { lightPenetrationRatio: 0.5 },
      {
        isWorldInverted: true,
        enableHighDpiRendering: true,
        ambientLight: rgb(0.35, 0.1, 0.45),
        colorPalette: [rgb(0.4, 0.5, 0.6), rgb(0, 0, 0), rgb(0, 0, 0), rgb(0, 0, 0)],
        textures: {
          noiseTexture: {
            source: noiseTexture,
            overrides: {
              maxFilter: FilteringOptions.LINEAR,
              wrapS: WrapOptions.MIRRORED_REPEAT,
            },
          },
        },
      }
    );
  }

  private deltaSinceStart = 0;
  private drawNextFrame(
    renderer: Renderer,
    currentTime: DOMHighResTimeStamp,
    deltaTime: DOMHighResTimeStamp
  ): boolean {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.deltaSinceStart += deltaTime;
    const startX = this.deltaSinceStart / 3;
    const endX = startX + width;
    renderer.setViewArea(vec2.fromValues(startX, height), vec2.fromValues(width, height));

    this.overlay.innerText = prettyPrint(renderer.insights);

    [
      ...this.tunnels.filter(
        (t) => startX < t.to.x + t.toRadius && t.from.x - t.fromRadius <= endX
      ),
      ...this.lights,
    ].forEach((d) => renderer.addDrawable(d));

    return currentTime < settings.sceneTimeInMilliseconds;
  }
}
