import React from 'react';
import { Style } from '../@types/types';

interface Props {
  className: string;
  value: string;
  loadingValue: string;
  isLoading: boolean;
  disabled: boolean;
  style: Style;
}

export default function LoadingButton(props: Props) {
  const { value, loadingValue, className, isLoading, disabled } = props;
  return isLoading ? (
    <input className={className} type="submit" value={loadingValue} disabled />
  ) : (
    <input
      className={className}
      type="submit"
      value={value}
      disabled={disabled}
    />
  );
}
