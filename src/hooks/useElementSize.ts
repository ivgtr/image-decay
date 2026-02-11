import { useEffect, useState, type RefObject } from 'react';

interface ElementSize {
  width: number;
  height: number;
}

const EMPTY_SIZE: ElementSize = { width: 0, height: 0 };

export const useElementSize = <T extends HTMLElement>(ref: RefObject<T | null>, enabled: boolean): ElementSize => {
  const [size, setSize] = useState<ElementSize>(EMPTY_SIZE);

  useEffect(() => {
    if (!enabled || !ref.current) {
      setSize(EMPTY_SIZE);
      return;
    }

    const element = ref.current;
    const updateSize = () => {
      const nextWidth = element.clientWidth;
      const nextHeight = element.clientHeight;
      setSize((prev) => {
        if (prev.width === nextWidth && prev.height === nextHeight) {
          return prev;
        }
        return { width: nextWidth, height: nextHeight };
      });
    };

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);
    updateSize();

    return () => {
      observer.disconnect();
    };
  }, [enabled, ref]);

  return size;
};
