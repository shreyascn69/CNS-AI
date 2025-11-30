
'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
  HTMLMotionProps,
} from 'framer-motion';
import React, {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '../../lib/utils';

const DOCK_HEIGHT = 256;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 140;
const DEFAULT_PANEL_HEIGHT = 90;

export type DockProps = {
  children?: React.ReactNode;
  className?: string;
  distance?: number;
  panelHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
  itemWidth?: number; // Added to support responsive sizing
};
export type DockItemProps = HTMLMotionProps<'div'> & {
  className?: string;
  children?: React.ReactNode;
};
export type DockLabelProps = {
  className?: string;
  children?: React.ReactNode;
};
export type DockIconProps = {
  className?: string;
  children?: React.ReactNode;
};

type DocContextType = {
  mouseX: MotionValue;
  spring: SpringOptions;
  magnification: number;
  distance: number;
  itemWidth: number; // Added to context
};
type DockProviderProps = {
  children?: React.ReactNode;
  value: DocContextType;
};

const DockContext = createContext<DocContextType | undefined>(undefined);

function DockProvider({ children, value }: DockProviderProps) {
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDock must be used within an DockProvider');
  }
  return context;
}

export function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 250, damping: 15 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
  itemWidth = 64, // Default base width
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(() => {
    return Math.max(DOCK_HEIGHT, magnification + magnification / 2 + 4);
  }, [magnification]);

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      style={{
        height: height,
        scrollbarWidth: 'none',
      }}
      className='mx-2 flex max-w-full items-end overflow-visible'
    >
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={cn(
          'mx-auto flex w-fit gap-4 rounded-2xl px-4 pb-4',
          className
        )}
        style={{ height: panelHeight }}
        role='toolbar'
        aria-label='Application dock'
      >
        <DockProvider value={{ mouseX, spring, distance, magnification, itemWidth }}>
          {children}
        </DockProvider>
      </motion.div>
    </motion.div>
  );
}

export function DockItem({ children, className, ...props }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { distance, magnification, mouseX, spring, itemWidth } = useDock();

  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - domRect.x - domRect.width / 2;
  });

  // Dynamic width based on itemWidth prop
  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [itemWidth, magnification, itemWidth]
  );

  const width = useSpring(widthTransform, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
      tabIndex={0}
      role='button'
      aria-haspopup='true'
      {...props}
    >
      {Children.map(children, (child) =>
        cloneElement(child as React.ReactElement<any>, { width, isHovered })
      )}
    </motion.div>
  );
}

export function DockLabel({ children, className, ...rest }: DockLabelProps) {
  return (
    <div
      className={cn(
        'absolute top-full left-1/2 -translate-x-1/2 w-max text-[10px] font-medium text-gray-400 mt-1 pointer-events-none select-none tracking-wide',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DockIcon({ children, className, ...rest }: DockIconProps) {
  const restProps = rest as Record<string, unknown>;
  const width = restProps['width'] as MotionValue<number>;

  // Scale icon to 65% of the bubble width
  const widthTransform = useTransform(width, (val) => val * 0.65);

  return (
    <motion.div
      style={{ width: widthTransform }}
      className={cn('flex items-center justify-center', className)}
    >
      {children}
    </motion.div>
  );
}
