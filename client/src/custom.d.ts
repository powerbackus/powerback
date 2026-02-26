// h/t https://bit.ly/41DmGJ3 @ https://bit.ly/2Y1y1lN

declare module '*.svg' {
  const content: ReactComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: ReactComponent<React.PNGAttributes<PNGElement>>;
  export default content;
}

declare module '*.webp' {
  const content: ReactComponent<React.WEBPAttributes<WEBPElement>>;
  export default content;
}

declare module '*';

declare module 'number-to-words';
