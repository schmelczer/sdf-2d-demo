import { glMatrix } from 'gl-matrix';
import { compile } from 'sdf-2d';
import '../static/favicons/apple-touch-icon.png';
import '../static/favicons/favicon-16x16.png';
import '../static/favicons/favicon-32x32.png';
import '../static/favicons/favicon.ico';
import '../static/logo-white.svg';
import '../static/no-change/404.html';
import '../static/no-change/og-image.png';
import '../static/no-change/robots.txt';
import { extractInsights } from './helper/extract-insights';
import { handleFullScreen } from './helper/handle-full-screen';
import { handleInsights } from './helper/handle-insights';
import { Random } from './helper/random';
import { removeUnnecessaryOutlines } from './helper/remove-unnecessary-outlines';
import { BlobScene } from './scenes/blob/blob-scene';
import { MetaballScene } from './scenes/metaball/metaball-scene';
import { RainScene } from './scenes/rain/rain-scene';
import { TunnelScene } from './scenes/tunnel-scene';
import './styles/index.scss';

const scenes = [TunnelScene, MetaballScene, RainScene, BlobScene];
Random.seed = 2;

glMatrix.setMatrixArrayType(Array);
removeUnnecessaryOutlines();

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const canvasContainer = document.querySelector('#canvas-container') as HTMLCanvasElement;
const errorText = document.querySelector('#error-text') as HTMLParamElement;
const errorsContainer = document.querySelector('#errors-container') as HTMLDivElement;
const toggleButton = document.querySelector('#toggle-text');
const minimizeButton = document.querySelector('#minimize') as HTMLElement;
const maximizeButton = document.querySelector('#maximize') as HTMLElement;
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

const startInsightsSession = async (): Promise<(data: any) => unknown> => {
  const dummyRenderer = await compile(document.createElement('canvas'), []);
  const { vendor, renderer, version } = extractInsights(dummyRenderer.insights);
  dummyRenderer.destroy();

  return await handleInsights({
    vendor,
    renderer,
    referrer: document.referrer,
    connection: (navigator as any)?.connection?.effectiveType,
    devicePixelRatio: devicePixelRatio,
    height: innerHeight,
    width: innerWidth,
    version,
  });
};

const main = async () => {
  const sendFramePromise = startInsightsSession();
  handleFullScreen(minimizeButton, maximizeButton, canvasContainer);

  try {
    let i = 0;
    for (;;) {
      const currentScene = new scenes[i++ % scenes.length]();
      await currentScene.run(canvas, overlay);

      const { fps, renderScale, lightScale } = extractInsights(currentScene.insights);
      (await sendFramePromise)({
        fps,
        renderScale,
        lightScale,
      });
    }
  } catch (e) {
    console.error(e);
    errorText.innerText = e;
    errorsContainer.style.visibility = 'visible';
  }
};

main();
