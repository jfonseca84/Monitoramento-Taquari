import React from 'react';
import { PageLayoutConfig, PositionMode } from '../types';
import { useLayoutConfig } from '../context/LayoutConfigContext';

interface LayoutBehaviorWrapperProps {
  config?: PageLayoutConfig;
  pageKey?: string;
  componentKey?: string;
  fallbackMode?: PositionMode;
  fallbackOffset?: number;
  className?: string;
  children: React.ReactNode;
}

export const LayoutBehaviorWrapper: React.FC<LayoutBehaviorWrapperProps> = ({
  config: directConfig,
  pageKey,
  componentKey,
  fallbackMode = 'flow',
  fallbackOffset = 76,
  className = '',
  children
}) => {
  const { getComponentConfig } = useLayoutConfig();

  let effectiveConfig: PageLayoutConfig | undefined = directConfig;

  if (!effectiveConfig && pageKey && componentKey) {
    effectiveConfig = getComponentConfig(pageKey, componentKey);
  }

  const positionMode = effectiveConfig?.position_mode || fallbackMode;
  const stickyOffset = effectiveConfig?.sticky_offset ?? fallbackOffset;

  const isSticky = positionMode === 'sticky';

  return (
    <div
      className={`w-full ${isSticky ? 'lg:sticky lg:self-start z-10' : ''} ${className}`}
      style={isSticky ? { top: `${stickyOffset}px` } : undefined}
    >
      {children}
    </div>
  );
};
