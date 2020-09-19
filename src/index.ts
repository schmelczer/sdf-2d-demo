import { glMatrix } from 'gl-matrix';
import { DeltaTimeCalculator } from './helper/delta-time-calculator';
import './index.scss';
import { RainScene } from './scenes/rain/rain-scene';
import { Scene } from './scenes/scene';
import { TunnelScene } from './scenes/tunnel-scene';

const scenes = [TunnelScene, RainScene];
const sceneIntervalInSeconds = 8;

glMatrix.setMatrixArrayType(Array);

const deltaTimeCalculator = new DeltaTimeCalculator();
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const info = document.querySelector('#info');
const errorText = document.querySelector('#error-text') as HTMLParamElement;
const errorsContainer = document.querySelector('#errors-container') as HTMLDivElement;
const button = document.querySelector('#remove-clutter');
const overlay = document.querySelector('#overlay') as HTMLDivElement;

button.addEventListener('click', () =>
  [info, button, overlay].forEach((e) => e.remove())
);

const handleScene = async (SceneConstructor: new () => Scene) => {
  const scene = new SceneConstructor();
  await scene.initialize(canvas, overlay);

  let triggerIsOver: () => void;
  const isOver = new Promise((resolve) => (triggerIsOver = resolve));
  let timeSinceStart = 0;

  const handleFrame = (currentTime: DOMHighResTimeStamp) => {
    const deltaTime = deltaTimeCalculator.getNextDeltaTime(currentTime);

    scene.drawNextFrame(currentTime, deltaTime);

    if ((timeSinceStart += deltaTime) > sceneIntervalInSeconds * 1000) {
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
    let i = 0;
    for (;;) {
      await handleScene(scenes[i++ % scenes.length]);
    }
  } catch (e) {
    console.error(e);
    errorText.innerText = e;
    errorsContainer.style.display = 'flex';
  }
};

main();
