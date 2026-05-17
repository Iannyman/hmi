"use client";

import { useRef, useState, useCallback } from "react";

interface UseLongPressOptions {
  delay?: number;
  onLongPress: () => void;
  onPress?: () => void;
  moveThreshold?: number;
}

interface UseLongPressReturn {
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onContextMenu: (e: React.SyntheticEvent) => void;
  };
  isPressed: boolean;
}

export function useLongPress({
  delay = 500,
  onLongPress,
  onPress,
  moveThreshold = 10,
}: UseLongPressOptions): UseLongPressReturn {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressFiredRef = useRef(false);
  const isTouchRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setIsPressed(false);
    isLongPressFiredRef.current = false;
  }, [clearTimer]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Skip if touch already handled this gesture
      if (isTouchRef.current) return;
      // Only trigger on the element itself, not interactive children
      if (e.target !== e.currentTarget) return;

      isLongPressFiredRef.current = false;
      setIsPressed(true);

      timerRef.current = setTimeout(() => {
        isLongPressFiredRef.current = true;
        setIsPressed(false);
        onLongPress();
      }, delay);
    },
    [delay, onLongPress]
  );

  const handleMouseUp = useCallback(() => {
    if (isTouchRef.current) return;

    const wasLongPress = isLongPressFiredRef.current;
    reset();

    if (!wasLongPress && onPress) {
      onPress();
    }
  }, [onPress, reset]);

  const handleMouseLeave = useCallback(() => {
    if (isTouchRef.current) return;
    reset();
  }, [reset]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.target !== e.currentTarget) return;

      isTouchRef.current = true;
      isLongPressFiredRef.current = false;

      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };

      setIsPressed(true);

      timerRef.current = setTimeout(() => {
        isLongPressFiredRef.current = true;
        setIsPressed(false);
        onLongPress();
      }, delay);
    },
    [delay, onLongPress]
  );

  const handleTouchEnd = useCallback(() => {
    const wasLongPress = isLongPressFiredRef.current;
    reset();

    if (!wasLongPress && onPress) {
      onPress();
    }

    // Clear touch flag after a short delay to skip synthesized mouse events
    setTimeout(() => {
      isTouchRef.current = false;
    }, 300);
  }, [onPress, reset]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);

      if (dx > moveThreshold || dy > moveThreshold) {
        reset();
      }
    },
    [moveThreshold, reset]
  );

  const handleContextMenu = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
  }, []);

  return {
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onContextMenu: handleContextMenu,
    },
    isPressed,
  };
}
