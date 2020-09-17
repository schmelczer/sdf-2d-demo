import { vec2, vec3 } from 'gl-matrix';
import { CircleLight, compile, Renderer, Tunnel } from 'sdf-2d';
import { Scene } from './scene';

export class TunnelScene implements Scene {
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;
  private overlay: HTMLDivElement;

  public constructor() {}

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
          ...Tunnel.descriptor,
          shaderCombinationSteps: [0, 1, 2, 4, 8, 12],
        },
        {
          ...CircleLight.descriptor,
          shaderCombinationSteps: [2],
        },
      ],
      [
        vec3.fromValues(0.4, 1, 0.6),
        vec3.fromValues(1, 1, 0),
        vec3.fromValues(0.3, 1, 1),
      ],
      {
        enableStopwatch: false,
        softShadowTraceCount: '128',
        hardShadowTraceCount: '48',
      }
    );
  }

  public drawNextFrame(
    currentTime: DOMHighResTimeStamp,
    deltaTime: DOMHighResTimeStamp
  ): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.renderer.setViewArea(vec2.fromValues(0, height), vec2.fromValues(width, height));
    this.renderer.autoscaleQuality(deltaTime);

    this.overlay.innerText = JSON.stringify(
      this.renderer.insights,
      (_, v) => (v.toFixed ? Number(v.toFixed(2)) : v),
      '  '
    );

    const viewAreaSize = this.renderer.viewAreaSize;

    [
      new Tunnel(vec2.fromValues(200, 200), vec2.fromValues(600, 600), 30, 200),
    ].forEach((d) => this.renderer.addDrawable(d));

    this.renderer.renderDrawables();
  }

  public destroy(): void {
    this.renderer.destroy();
  }
}
