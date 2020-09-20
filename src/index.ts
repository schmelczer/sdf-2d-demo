import { glMatrix } from 'gl-matrix';
import '../static/favicons/apple-touch-icon.png';
import '../static/favicons/favicon-16x16.png';
import '../static/favicons/favicon-32x32.png';
import '../static/favicons/favicon.ico';
//import '../static/og-image.jpg';
import { DeltaTimeCalculator } from './helper/delta-time-calculator';
import { removeUnnecessaryOutlines } from './helper/remove-unnecessary-outlines';
import { BlobScene } from './scenes/blob-scene';
import { Scene } from './scenes/scene';
import './styles/index.scss';

const scenes = [/*TunnelScene, RainScene*/ BlobScene];
const sceneIntervalInSeconds = 80000;

glMatrix.setMatrixArrayType(Array);
removeUnnecessaryOutlines();

const deltaTimeCalculator = new DeltaTimeCalculator();
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const info = document.querySelector('#info') as HTMLDivElement;
const errorText = document.querySelector('#error-text') as HTMLParamElement;
const errors = document.querySelector('#errors') as HTMLDivElement;
const errorsContainer = document.querySelector('#errors-container') as HTMLDivElement;
const toggleButton = document.querySelector('#toggle-text');
const overlay = document.querySelector('#overlay') as HTMLDivElement;

let textVisible = false;
const handleTextToggle = () => {
  [info, overlay, errors].forEach(
    (e) => (e.style.visibility = textVisible ? 'hidden' : 'inherit')
  );
  textVisible = !textVisible;
  toggleButton.innerHTML = textVisible ? 'Hide text' : 'Show text';
};
toggleButton.addEventListener('click', handleTextToggle);
handleTextToggle();

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
    errorsContainer.style.visibility = 'visible';
  }
};

main();
