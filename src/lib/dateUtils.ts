/**
 * Utility functions for date and time formatting synchronized with Horário de Brasília (BRT, UTC-3).
 */

export const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

/**
 * Formats a given date/timestamp or current time into BRT (America/Sao_Paulo) 24h time format "HH:mm".
 */
export function getBrasiliaTimeString(dateInput?: string | number | Date): string {
  if (!dateInput) {
    return new Date().toLocaleTimeString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (typeof dateInput === 'string') {
    let d = new Date(dateInput);
    
    // Handle SQL/station format "YYYY-MM-DD HH:MM:SS" without T or Z
    if (isNaN(d.getTime()) && dateInput.includes(' ')) {
      d = new Date(dateInput.replace(' ', 'T') + '-03:00');
    }

    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('pt-BR', {
        timeZone: BRASILIA_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // If string is already "HH:mm" or "HH:MM", extract or return
    const matchTime = dateInput.match(/\b(\d{2}:\d{2})\b/);
    if (matchTime) {
      return matchTime[1];
    }
  }

  if (typeof dateInput === 'number' || dateInput instanceof Date) {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('pt-BR', {
        timeZone: BRASILIA_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  return new Date().toLocaleTimeString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formats date into BRT date string "DD/MM/YYYY".
 */
export function getBrasiliaDateString(dateInput?: string | number | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return new Date().toLocaleDateString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  return d.toLocaleDateString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formats date and time into BRT string "DD/MM/YYYY HH:mm".
 */
export function getBrasiliaDateTimeString(dateInput?: string | number | Date): string {
  const dateStr = getBrasiliaDateString(dateInput);
  const timeStr = getBrasiliaTimeString(dateInput);
  return `${dateStr} ${timeStr}`;
}

/**
 * Returns formatted "Atualizado às HH:mm" in Horário de Brasília.
 */
export function getBrasiliaLastUpdatedString(dateInput?: string | number | Date): string {
  const time = getBrasiliaTimeString(dateInput);
  return `Atualizado às ${time}`;
}

