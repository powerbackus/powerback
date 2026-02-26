// h/t https://rb.gy/e1sulm @https://rb.gy/jlqlbd
export const simulateMouseClick = (element: HTMLInputElement) => {
  ['mousedown', 'click', 'mouseup'].forEach((mouseEventType) =>
    element.dispatchEvent(
      new MouseEvent(mouseEventType, {
        cancelable: true,
        bubbles: true,
        view: window,
        buttons: 1,
      })
    )
  );
};
