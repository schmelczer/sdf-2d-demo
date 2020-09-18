import { glMatrix } from 'gl-matrix';
import { DeltaTimeCalculator } from './helper/delta-time-calculator';
import './index.scss';
import { RainScene } from './scenes/rain/rain-scene';
import { Scene } from './scenes/scene';
import { TunnelScene } from './scenes/tunnel-scene';

glMatrix.setMatrixArrayType(Array);

const deltaTimeCalculator = new DeltaTimeCalculator();
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const overlay = document.querySelector('#overlay') as HTMLDivElement;

const handleScene = async (SceneConstructor: new () => Scene) => {
  const scene = new SceneConstructor();
  await scene.initialize(canvas, overlay);

  let triggerIsOver: () => void;
  const isOver = new Promise((resolve) => (triggerIsOver = resolve));
  let timeSinceStart = 0;

  const handleFrame = (currentTime: DOMHighResTimeStamp) => {
    const deltaTime = deltaTimeCalculator.getNextDeltaTime(currentTime);

    scene.drawNextFrame(currentTime, deltaTime);

    if ((timeSinceStart += deltaTime) > 8 * 1000) {
      triggerIsOver();
    } else {
      requestAnimationFrame(handleFrame);
    }
  };

  requestAnimationFrame(handleFrame);
  await isOver;

  scene.destroy();
};

const main = async () => {
  try {
    const scenes = [RainScene, TunnelScene];

    let i = 0;
    for (;;) {
      await handleScene(scenes[i++ % scenes.length]);
    }
  } catch (e) {
    console.error(e);
    alert(e);
  }
};

main();
