import { vec2, vec3 } from 'gl-matrix';
import { CircleLight, compile, InvertedTunnel, Renderer } from 'sdf-2d';
import { clamp } from '../helper/clamp';
import { last } from '../helper/last';
import { Random } from '../helper/random';
import { Scene } from './scene';

export class TunnelScene implements Scene {
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;
  private overlay: HTMLDivElement;

  private tunnels: Array<InvertedTunnel> = [];
  private lights: Array<CircleLight> = [];

  private generateTunnel() {
    const canvasSize = this.canvas.getBoundingClientRect();

    let previousEnd = vec2.fromValues(0, 200);
    let previousRadius = 75;

    if (this.tunnels.length > 0) {
      previousEnd = last(this.tunnels).to;
      previousRadius = last(this.tunnels).toRadius;
    }

    let height = previousEnd.y + Random.getRandomInRange(-400, 400);
    height = clamp(height, 200, canvasSize.height - 200);

    const currentEnd = vec2.fromValues(this.tunnels.length * 200, height);
    const currentToRadius = Random.getRandom() * 100 + 50;

    this.tunnels.push(
      new InvertedTunnel(previousEnd, currentEnd, previousRadius, currentToRadius)
    );

    if (this.tunnels.length % 5 == 0) {
      this.lights.push(
        new CircleLight(
          previousEnd,
          [Random.getRandom(), Random.getRandom(), Random.getRandom()],
          0.25
        )
      );
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
          ...InvertedTunnel.descriptor,
          shaderCombinationSteps: [0, 1, 2, 4, 8, 12],
        },
        {
          ...CircleLight.descriptor,
          shaderCombinationSteps: [1, 2, 3, 4, 5, 6, 7],
        },
      ],
      [
        vec3.fromValues(0.4, 1, 0.6),
        vec3.fromValues(1, 1, 0),
        vec3.fromValues(0.3, 1, 1),
      ],
      {
        softShadowTraceCount: '64',
        hardShadowTraceCount: '16',
      }
    );

    this.renderer.setRuntimeSettings({
      isWorldInverted: true,
      ambientLight: vec3.fromValues(0.45, 0.25, 0.45),
    });

    for (let i = 0; i < 100; i++) {
      this.generateTunnel();
    }
  }

  private deltaSinceStart = 0;
  public drawNextFrame(
    currentTime: DOMHighResTimeStamp,
    deltaTime: DOMHighResTimeStamp
  ): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.deltaSinceStart += deltaTime;
    this.renderer.setViewArea(
      vec2.fromValues(this.deltaSinceStart / 2, height),
      vec2.fromValues(width, height)
    );

    this.renderer.autoscaleQuality(deltaTime);

    this.overlay.innerText = JSON.stringify(
      this.renderer.insights,
      (_, v) => (v.toFixed ? Number(v.toFixed(2)) : v),
      '  '
    );

    [...this.tunnels, ...this.lights].forEach((d) => this.renderer.addDrawable(d));

    this.renderer.renderDrawables();
  }

  public destroy(): void {
    this.renderer.destroy();
  }
}
