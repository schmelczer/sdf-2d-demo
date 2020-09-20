export const removeUnnecessaryOutlines = () =>
  (document.onclick = (e) => {
    (e.target as HTMLElement)?.blur();
  });
