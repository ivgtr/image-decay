import { useEffect, useState, type RefObject } from 'react';

export const useElementWidth = <T extends HTMLElement>(ref: RefObject<T | null>, enabled: boolean): number => {
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    if (!enabled || !ref.current) {
      setWidth(0);
      return;
    }

    const element = ref.current;
    const updateWidth = () => {
      setWidth(element.clientWidth);
    };

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);
    updateWidth();

    return () => {
      observer.disconnect();
    };
  }, [enabled, ref]);

  return width;
};
