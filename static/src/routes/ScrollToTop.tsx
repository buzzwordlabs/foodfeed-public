import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface Props {
  children: React.ReactChildren;
}

const ScrollToTop = (props: Props) => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return props.children;
};

export default ScrollToTop;
