import React from 'react';
import { appStoreIcon, playStoreIcon } from '../assets/images';
import { appStoreLink, playStoreLink } from '../constants';

interface Props {
  platform: 'ios' | 'android';
  anchorProps?: React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >;
  imgProps?: React.DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  >;
  height?: string;
  width?: string;
}

const MobileStoreButton: React.FC<Props> = (props: Props) => {
  const { platform, anchorProps } = props;
  return (
    <a
      style={{ textDecoration: 'none' }}
      href={platform === 'ios' ? appStoreLink : playStoreLink}
      target="_blank"
      rel="noopener noreferrer"
      {...anchorProps}
    >
      <img
        src={platform === 'ios' ? appStoreIcon : playStoreIcon}
        style={{ height: '4rem', width: '12rem', objectFit: 'contain' }}
        alt={platform === 'ios' ? 'App Store Icon' : 'Play Store Icon'}
      />
    </a>
  );
};

export default MobileStoreButton;
