import React from 'react';
import { Style } from '../@types/types';

interface Props {
  value: string;
  role?: string;
  ariaLabel?: string;
  containerClassName?: string;
  className?: string;
  containerStyle?: Style;
  style?: Style;
}

export default function Emoji(props: Props) {
  return (
    <div className={props.containerClassName} style={props.containerStyle}>
      <span
        className={props.className}
        style={props.style}
        role={props.role || 'img'}
        aria-label={props.ariaLabel || 'An emoji'}
      >
        {' '}
        {props.value}
      </span>
    </div>
  );
}
