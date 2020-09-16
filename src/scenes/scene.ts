import { Drawable, DrawableDescriptor } from 'sdf-2d';

export interface Scene {
  readonly descriptors: Array<DrawableDescriptor>;
  animate(
    currentTime: DOMHighResTimeStamp,
    viewAreaSize: { width: number; height: number }
  ): void;
  readonly drawables: Array<Drawable>;
}
