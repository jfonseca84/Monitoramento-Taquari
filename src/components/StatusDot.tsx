import React from 'react';
import { LevelStatus } from '../types';
import { STATUS_COLORS } from './homeTheme';

interface StatusDotProps {
  status?: LevelStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status = 'normal',
  size = 'md',
  className = ''
}) => {
  const isFlood = status === 'inundacao';
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal;

  const dotSizes = {
    sm: 'w-[7px] h-[7px]',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5'
  };

  const containerSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4.5 h-4.5'
  };

  if (isFlood) {
    return (
      <span
        title="INUNDAÇÃO: Alerta em tempo real"
        className={`relative inline-flex items-center justify-center shrink-0 mx-1 ${containerSizes[size]} ${className}`}
      >
        {/* Onda sonora / sonar 1 */}
        <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-sonar-1 pointer-events-none" style={{ backgroundColor: color }} />
        {/* Onda sonora / sonar 2 (atrasada) */}
        <span className="absolute inline-flex h-full w-full rounded-full opacity-50 animate-sonar-2 pointer-events-none" style={{ backgroundColor: color }} />
        {/* Bolinha vermelha piscando */}
        <span
          className={`relative inline-flex rounded-full animate-alert-blink ${dotSizes[size]}`}
          style={{ backgroundColor: color }}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-block rounded-full shrink-0 ${dotSizes[size]} ${status === 'alerta' ? 'animate-pulse' : ''} ${className}`}
      style={{ backgroundColor: color }}
    />
  );
};
