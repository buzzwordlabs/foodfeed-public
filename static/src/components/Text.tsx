import React from 'react';
import {
  errorText,
  successText,
  contrastedTextColor,
  textColor,
  tintColor
} from '../constants';
import { Children, GenericOnClick, Style } from '../@types/types';

export type FontType = 'error' | 'success' | 'muted' | 'highlight' | 'inverse';
export type FontSize =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'sm'
  | 'span'
  | undefined;
export type FontWeight = 300 | 400 | 500 | 600 | 700 | 800 | 'bold';
export type FontAlignment = 'left' | 'center' | 'right';

interface Props {
  children: Children;
  className?: string;
  style?: Style;
  noMargin?: boolean;
  italic?: boolean;
  size?: FontSize;
  s?: FontSize;
  type?: FontType;
  t?: FontType;
  align?: FontAlignment;
  a?: FontAlignment;
  weight?: FontWeight;
  w?: FontWeight;
  onClick?: GenericOnClick;
}

const Text = (props: Props) => {
  const {
    align,
    a,
    size,
    s,
    type,
    t,
    weight,
    w,
    italic,
    style,
    noMargin,
    children,
    className = ''
  } = props;
  const alignment = resolveAlignment(align || a);
  const color = resolveType(type || t);
  const margin = noMargin ? { margin: '0' } : {};
  const finalStyle = {
    color,
    fontStyle: italic ? 'italic' : 'normal',
    fontWeight: weight || w || 'normal',
    ...margin,
    ...alignment,
    ...style
  };
  return resolveFontSize(
    size || s,
    props,
    finalStyle as any,
    className,
    children
  );
};

const resolveFontSize = (
  size: FontSize,
  props: Props,
  style: Style,
  className: string,
  children: Children
) => {
  switch (size) {
    case 'h1':
      return (
        <h1 {...props} style={style} className={className}>
          {children}
        </h1>
      );
    case 'h2':
      return (
        <h2 {...props} style={style} className={className}>
          {children}
        </h2>
      );
    case 'h3':
      return (
        <h3 {...props} style={style} className={className}>
          {children}
        </h3>
      );
    case 'h4':
      return (
        <h4 {...props} style={style} className={className}>
          {children}
        </h4>
      );
    case 'h5':
      return (
        <h5 {...props} style={style} className={className}>
          {children}
        </h5>
      );
    case 'h6':
      return (
        <h6 {...props} style={style} className={className}>
          {children}
        </h6>
      );
    case 'p':
      return (
        <p {...props} style={style} className={className}>
          {children}
        </p>
      );
    case 'span':
      return (
        <span {...props} style={style} className={className}>
          {children}
        </span>
      );
    case 'sm':
      return (
        <span
          {...props}
          style={{ ...style, fontSize: '0.8rem' }}
          className={className}
        >
          {children}
        </span>
      );
    default:
      return (
        <p {...props} style={{ ...style, fontSize: 15 }} className={className}>
          {children}
        </p>
      );
  }
};

const resolveAlignment = (align: FontAlignment | undefined) => {
  switch (align) {
    case 'left':
      return { textAlign: 'left', alignSelf: 'flex-start' };
    case 'center':
      return { textAlign: 'center', alignSelf: 'center' };
    case 'right':
      return { textAlign: 'right', alignSelf: 'flex-end' };
    default:
      return { textAlign: 'left', alignSelf: 'flex-start' };
  }
};

const resolveType = (type: FontType | undefined) => {
  switch (type) {
    case 'error':
      return errorText;
    case 'success':
      return successText;
    case 'muted':
      return 'gray';
    case 'highlight':
      return tintColor;
    case 'inverse':
      return contrastedTextColor;
    default:
      return textColor;
  }
};

export default Text;
