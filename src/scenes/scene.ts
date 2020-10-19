export interface Scene {
  run(canvas: HTMLCanvasElement, overlay: HTMLDivElement): Promise<void>;
}
