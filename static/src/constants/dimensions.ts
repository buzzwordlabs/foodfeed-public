import { ScreenSizes } from '../@types/types';

const width = window.innerWidth;
const height = window.innerHeight;

const screenSize: ScreenSizes = (() => {
  if (width >= 1200) return 'lg';
  else if (width >= 992 && width < 1200) return 'md';
  else if (width >= 768 && width < 992) return 'sm';
  else return 'xs';
})();

const smallerThanSM = (() => ['xs'].includes(screenSize!))();
const smallerThanMD = (() => ['xs', 'sm'].includes(screenSize!))();
const smallerThanLG = (() => ['xs', 'sm', 'md'].includes(screenSize!))();

export {
  width,
  height,
  screenSize,
  smallerThanSM,
  smallerThanMD,
  smallerThanLG
};
