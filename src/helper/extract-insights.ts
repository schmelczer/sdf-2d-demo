import { RendererInfo } from 'sdf-2d/lib/src/graphics/rendering/renderer/renderer-info';

export const extractInsights = (
  insights?: RendererInfo
): {
  vendor?: string;
  renderer?: string;
  fps?: number;
  renderScale?: number;
  lightScale?: number;
} => ({
  fps: insights?.fps,
  vendor: insights?.vendor,
  renderer: insights?.renderer,
  renderScale: insights?.renderPasses.distance.renderScale,
  lightScale: insights?.renderPasses.lights.renderScale,
});
