import { vec3 } from 'gl-matrix';
import { Circle, CircleLight, compile, InvertedTunnel, Renderer } from 'sdf-2d';
import { Scene } from './scene';

export class BlobScene implements Scene {
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;
  private overlay: HTMLDivElement;

  private tunnels: Array<InvertedTunnel> = [];
  private lights: Array<CircleLight> = [];

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
        Circle.descriptor,
        {
          ...CircleLight.descriptor,
          shaderCombinationSteps: [1, 2, 3, 4, 5, 6, 7],
        },
      ],
      [vec3.fromValues(0.4, 1, 0.6), vec3.fromValues(1, 1, 0), vec3.fromValues(0.3, 1, 1)]
    );

    this.renderer.setRuntimeSettings({
      ambientLight: vec3.fromValues(0.35, 0.1, 0.45),
      shadowLength: 550,
    });
  }

  private deltaSinceStart = 0;
  public drawNextFrame(
    currentTime: DOMHighResTimeStamp,
    deltaTime: DOMHighResTimeStamp
  ): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.deltaSinceStart += deltaTime;
    this.renderer.setViewArea([0, height], [width, height]);

    this.renderer.autoscaleQuality(deltaTime);
    this.overlay.innerText = JSON.stringify(
      this.renderer.insights,
      (_, v) => (v.toFixed ? Number(v.toFixed(2)) : v),
      '  '
    );

    const q = (this.deltaSinceStart % 5000) / 2500;
    console.log(q);

    [
      new Circle([width / 2, -width / 4], width / 2),
      new CircleLight([q * width, Math.sin(q * Math.PI) * height], [1, 0.8, 0], 1),
      new CircleLight(
        [(q - 1) * width, Math.sin((q - 1) * Math.PI) * height],
        [0, 0.8, 1],
        1
      ),
    ].forEach((d) => this.renderer.addDrawable(d));

    this.renderer.renderDrawables();
  }

  public destroy(): void {
    this.renderer.destroy();
  }
}
