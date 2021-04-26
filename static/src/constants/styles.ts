import { fadedTintColor } from '../constants';

const boxShadow = {
  '-webkit-box-shadow': '8px 10px 21px -12px rgba(0,0,0,0.75)',
  '-moz-box-shadow': '8px 10px 21px -12px rgba(0,0,0,0.75)',
  boxShadow: '8px 10px 21px -12px rgba(0,0,0,0.75)'
};

const redBoxShadow = {
  '-webkit-box-shadow': `0px 4px 14px 0px ${fadedTintColor}`,
  '-moz-box-shadow': `0px 4px 14px 0px ${fadedTintColor}`,
  boxShadow: `0px 4px 14px 0px ${fadedTintColor}`
};

const translationSize = -5;

const riseUp = {
  '-moz-transform': `translateY(${translationSize}px)`,
  '-ms-transform': `translateY(${translationSize}px)`,
  '-o-transform': `translateY(${translationSize}px)`,
  '-webkit-transform': `translateY(${translationSize}px)`,
  transform: `translateY(${translationSize}px)`,
  transition: 'ease-in-out 0.25s'
};

export { boxShadow, redBoxShadow, riseUp };
