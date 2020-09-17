export interface Scene {
  initialize(canvas: HTMLCanvasElement, overlay: HTMLDivElement): Promise<void>;
  drawNextFrame(currentTime: DOMHighResTimeStamp, deltaTime: DOMHighResTimeStamp): void;
  destroy(): void;
}
