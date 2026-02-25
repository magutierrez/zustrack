'use client';

import { useState, useEffect, createContext, useContext } from 'react';

export type UnitSystem = 'metric' | 'us' | 'uk' | 'imperial';
export type WindUnit = 'kmh' | 'mph' | 'knots' | 'ms';

interface SettingsContextType {
  unitSystem: UnitSystem;
  windUnit: WindUnit;
  setUnitSystem: (system: UnitSystem) => void;
  setWindUnit: (unit: WindUnit) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
