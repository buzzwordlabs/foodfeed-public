import React, { useState, MouseEvent } from 'react';
import { Button as BSButton, ButtonProps } from 'react-bootstrap';
import { tintColor, fadedTintColor, redBoxShadow, riseUp } from '../constants';
import { Style, Children, Class } from '../@types/types';

interface Props extends ButtonProps {
  onClick: () => void | Promise<void>;
  style?: Style;
  className?: Class;
  children: Children;
}

const Button = (props: Props) => {
  const { style = {}, children, className } = props;
  const [hovered, setHovered] = useState<boolean>(false);
  const resolveStyle = (hovered: boolean, style: Style) => {
    const base = {
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem',
      backgroundColor: tintColor,
      borderColor: fadedTintColor,
      ...redBoxShadow,
      ...style
    };
    if (hovered) return { ...base, ...riseUp };
    else return base;
  };
  return (
    <BSButton
      variant="primary"
      size="lg"
      className={className}
      style={resolveStyle(hovered, style)}
      onMouseEnter={(_e: MouseEvent) => setHovered(true)}
      onMouseLeave={(_e: MouseEvent) => setHovered(false)}
      {...props}
    >
      {children}
    </BSButton>
  );
};

export default Button;
