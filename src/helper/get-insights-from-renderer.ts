import { Renderer } from 'sdf-2d';

export const getInsightsFromRenderer = (
  renderer?: Renderer
): {
  vendor?: string;
  renderer?: string;
  fps?: number;
  renderScale?: number;
  lightScale?: number;
} => ({
  fps: renderer?.insights?.fps,
  vendor: renderer?.insights?.vendor,
  renderer: renderer?.insights?.renderer,
  renderScale: renderer?.insights?.renderPasses.distance.renderScale,
  lightScale: renderer?.insights?.renderPasses.lights.renderScale,
});
