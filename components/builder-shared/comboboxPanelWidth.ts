export function measureComboboxPanelLayout(root: HTMLElement) {
  const rootWidth = root.getBoundingClientRect().width;
  const parentRect = root.parentElement?.getBoundingClientRect();
  const parentWidth = parentRect?.width ?? rootWidth;
  const targetWidth = Math.max(rootWidth, parentWidth);

  const viewportWidth = typeof window === "undefined" ? targetWidth : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;
  const gutter = 12;
  const rootRect = root.getBoundingClientRect();
  const anchorLeft = parentRect?.left ?? rootRect.left;
  const width = Math.min(targetWidth, viewportWidth - gutter * 2);
  const left = Math.min(
    Math.max(anchorLeft, gutter),
    Math.max(gutter, viewportWidth - gutter - width),
  );
  const top = Math.min(rootRect.bottom + 8, Math.max(gutter, viewportHeight - gutter));

  return {
    width,
    left,
    top,
  };
}
