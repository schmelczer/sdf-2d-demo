import { glMatrix, vec2, vec3 } from 'gl-matrix';
import { compile, Renderer } from 'sdf-2d';
import { DeltaTimeCalculator } from './helper/delta-time-calculator';
import './index.scss';
import { RainScene } from './scenes/rain-scene';
import { Scene } from './scenes/scene';

glMatrix.setMatrixArrayType(Array);

const deltaTimeCalculator = new DeltaTimeCalculator();
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const overlay = document.querySelector('#overlay') as HTMLDivElement;

const drawFrame = (
  renderer: Renderer,
  scene: Scene,
  deltaTime: DOMHighResTimeStamp,
  currentTime: DOMHighResTimeStamp
) => {
  const { width, height } = canvas.getBoundingClientRect();
  renderer.setViewArea(vec2.fromValues(0, height), vec2.fromValues(width, height));
  renderer.autoscaleQuality(deltaTime);

  overlay.innerText = JSON.stringify(
    renderer.insights,
    (_, v) => (v.toFixed ? Number(v.toFixed(2)) : v),
    '  '
  );

  scene.animate(currentTime, { width, height });

  scene.drawables.forEach((d) => renderer.addDrawable(d));
  renderer.renderDrawables();
};

const handleScene = async (scene: Scene) => {
  const renderer = compile(
    canvas,
    scene.descriptors,
    [vec3.fromValues(0.4, 1, 0.6), vec3.fromValues(1, 1, 0), vec3.fromValues(0.3, 1, 1)],
    {
      tileMultiplier: 10,
      enableStopwatch: false,
      shaderMacros: { softShadowTraceCount: '128', hardShadowTraceCount: '48' },
    }
  );

  let triggerIsOver: () => void;
  const isOver = new Promise((resolve) => (triggerIsOver = resolve));

  let timeSinceStart = 0;

  const handleFrame = (currentTime: DOMHighResTimeStamp) => {
    const deltaTime = deltaTimeCalculator.getNextDeltaTime(currentTime);

    drawFrame(renderer, scene, deltaTime, currentTime);

    if ((timeSinceStart += deltaTime) > 200000 * 1000) {
      triggerIsOver();
    } else {
      requestAnimationFrame(handleFrame);
    }
  };

  requestAnimationFrame(handleFrame);
  await isOver;

  renderer.destroy();
};

const scenes = [new RainScene()];

const main = async () => {
  let i = 0;
  for (;;) {
    await handleScene(scenes[i++ % scenes.length]);
  }
};

main();
