// eslint-disable-next-line
import React from 'react';
import { Redirect } from 'react-router-dom';

const AppLink: React.FC = () => {
  // @ts-ignore
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (/android/i.test(userAgent)) {
    window.location.replace(
      'https://play.google.com/store/apps/details?id=com.buzzwordlabs.foodfeed'
    );
  }

  // iOS detection from: http://stackoverflow.com/a/9039885/177710
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    window.location.replace(
      'https://apps.apple.com/us/app/foodfeed-live-food-streaming/id1514843947'
    );
  }

  return <Redirect to="/" />;
};

export default AppLink;
