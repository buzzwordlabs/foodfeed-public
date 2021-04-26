import { useEffect, useRef, useState } from "react";

const useDisappearingView = (timeout: number): [boolean, () => void] => {
  const [visible, setVisible] = useState(false);
  const ref: any = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(ref.current);
    };
  }, []);

  const onMakeVisible = () => {
    if (visible) {
      clearTimeout(ref.current);
      setVisible(true);
    } else {
      setVisible(true);
      clearTimeout(ref.current);
      ref.current = setTimeout(() => {
        setVisible(false);
      }, timeout);
    }
  };

  return [visible, onMakeVisible];
};

export default useDisappearingView;
