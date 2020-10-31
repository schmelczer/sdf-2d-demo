export const handleFullScreen = (
  minimizeButton: HTMLElement,
  maximizeButton: HTMLElement,
  target: HTMLElement
) => {
  if (!document.fullscreenEnabled) {
    minimizeButton.style.visibility = 'hidden';
    maximizeButton.style.visibility = 'hidden';
    return;
  }

  const isInFullScreen = (): boolean => document.fullscreenElement !== null;

  const showButtons = () => {
    minimizeButton.style.visibility = isInFullScreen() ? 'visible' : 'hidden';
    maximizeButton.style.visibility = isInFullScreen() ? 'hidden' : 'visible';
  };

  showButtons();

  let currentWindowHeight = innerHeight;

  const followToggle = () => {
    showButtons();
    currentWindowHeight = innerHeight;
  };

  const triggerToggle = async () => {
    await (isInFullScreen() ? document.exitFullscreen() : target.requestFullscreen());
    followToggle();
  };

  addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
      triggerToggle();
      e.preventDefault();
    }
  });

  addEventListener('resize', () => {
    if (isInFullScreen && currentWindowHeight > innerHeight) {
      followToggle();
    }
  });

  maximizeButton.addEventListener('click', triggerToggle);
  minimizeButton.addEventListener('click', triggerToggle);
};
