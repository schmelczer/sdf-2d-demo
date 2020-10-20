import { Renderer } from 'sdf-2d';

export interface Scene {
  run(canvas: HTMLCanvasElement, overlay: HTMLDivElement): Promise<void>;
  readonly renderer?: Renderer;
}
