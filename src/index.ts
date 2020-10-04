import { glMatrix } from 'gl-matrix';
import '../static/favicons/apple-touch-icon.png';
import '../static/favicons/favicon-16x16.png';
import '../static/favicons/favicon-32x32.png';
import '../static/favicons/favicon.ico';
import '../static/logo-white.svg';
import '../static/no-change/404.html';
import '../static/no-change/robots.txt';
import '../static/og-image.png';
import { DeltaTimeCalculator } from './helper/delta-time-calculator';
import { removeUnnecessaryOutlines } from './helper/remove-unnecessary-outlines';
import { BlobScene } from './scenes/blob/blob-scene';
import { MetaballScene } from './scenes/metaball/metaball-scene';
import { RainScene } from './scenes/rain/rain-scene';
import { Scene } from './scenes/scene';
import { TunnelScene } from './scenes/tunnel-scene';
import './styles/index.scss';

const scenes = [TunnelScene, MetaballScene, RainScene, BlobScene];
const sceneIntervalInSeconds = 8;

glMatrix.setMatrixArrayType(Array);
removeUnnecessaryOutlines();

const deltaTimeCalculator = new DeltaTimeCalculator();
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const errorText = document.querySelector('#error-text') as HTMLParamElement;
const errorsContainer = document.querySelector('#errors-container') as HTMLDivElement;
const toggleButton = document.querySelector('#toggle-text');
const overlay = document.querySelector('#overlay') as HTMLDivElement;

let textVisible = true;
const handleTextToggle = () => {
  textVisible = !textVisible;
  overlay.style.visibility = textVisible ? 'visible' : 'hidden';
  toggleButton.innerHTML = textVisible ? 'Hide insights' : 'Show insights';
  if (textVisible) {
    toggleButton.classList.remove('off');
  } else {
    toggleButton.classList.add('off');
  }
};
toggleButton.addEventListener('click', handleTextToggle);
handleTextToggle();

const handleScene = async (
  currentScene: Scene,
  NextSceneConstructor: new () => Scene
): Promise<Scene> => {
  let triggerIsOver: () => void;
  const isOver = new Promise((resolve) => (triggerIsOver = resolve));
  let timeSinceStart = 0;

  const handleFrame = (currentTime: DOMHighResTimeStamp) => {
    const deltaTime = deltaTimeCalculator.getNextDeltaTime(currentTime);

    currentScene.drawNextFrame(currentTime, deltaTime);

    if ((timeSinceStart += deltaTime) > sceneIntervalInSeconds * 1000) {
      triggerIsOver();
    } else {
      requestAnimationFrame(handleFrame);
    }
  };

  requestAnimationFrame(handleFrame);

  await isOver;
  currentScene.destroy();

  const nextScene = new NextSceneConstructor();
  await nextScene.initialize(canvas, overlay);

  return nextScene;
};

const main = async () => {
  try {
    let i = 0;
    let currentScene: Scene = new scenes[i++]();
    await currentScene.initialize(canvas, overlay);
    for (;;) {
      currentScene = await handleScene(currentScene, scenes[i++ % scenes.length]);
    }
  } catch (e) {
    console.error(e);
    errorText.innerText = e;
    errorsContainer.style.visibility = 'visible';
  }
};

main();
