export function createRectCache(element: HTMLElement) {
  let rect = element.getBoundingClientRect();
  const update = () => {
    rect = element.getBoundingClientRect();
  };
  const observer = new ResizeObserver(update);
  observer.observe(element);
  window.addEventListener('scroll', update, true);
  window.addEventListener('resize', update);
  return {
    get current() {
      return rect;
    },
    destroy() {
      observer.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    },
  };
}
