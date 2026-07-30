import React from 'react';
import { LevelStatus } from '../types';

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

  const dotSizes = {
    sm: 'w-2 h-2',
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
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-sonar-1 pointer-events-none" />
        {/* Onda sonora / sonar 2 (atrasada) */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-50 animate-sonar-2 pointer-events-none" />
        {/* Bolinha vermelha piscando */}
        <span
          className={`relative inline-flex rounded-full bg-red-500 shadow-lg shadow-red-500/90 animate-alert-blink ${dotSizes[size]}`}
        />
      </span>
    );
  }

  const colorMap: Record<LevelStatus, string> = {
    inundacao: 'bg-red-500 shadow-red-500/50',
    alerta: 'bg-orange-500 shadow-orange-500/50 animate-pulse',
    atencao: 'bg-amber-400 shadow-amber-400/50',
    normal: 'bg-emerald-400 shadow-emerald-400/50'
  };

  return (
    <span
      className={`inline-block rounded-full shrink-0 shadow-sm ${dotSizes[size]} ${colorMap[status]} ${className}`}
    />
  );
};
