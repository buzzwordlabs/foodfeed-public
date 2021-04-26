import React from 'react';
import CSS from 'csstype';

export type Style = CSS.Properties;
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type SubmitFormEvent = React.FormEvent<HTMLFormElement>;
export type ScreenSizes = 'xs' | 'sm' | 'md' | 'lg' | undefined;
export type Children = any;
export type GenericOnClick = () => void | Promise<void>;
export type Class = any;
