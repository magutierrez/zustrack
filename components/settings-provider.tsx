'use client';

import React, { useState } from 'react';
import { SettingsContext, UnitSystem, WindUnit } from '@/hooks/use-settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(
    () => (typeof window !== 'undefined' && (localStorage.getItem('unitSystem') as UnitSystem)) || 'metric',
  );
  const [windUnit, setWindUnitState] = useState<WindUnit>(
    () => (typeof window !== 'undefined' && (localStorage.getItem('windUnit') as WindUnit)) || 'kmh',
  );

  const setUnitSystem = (system: UnitSystem) => {
    setUnitSystemState(system);
    localStorage.setItem('unitSystem', system);
  };

  const setWindUnit = (unit: WindUnit) => {
    setWindUnitState(unit);
    localStorage.setItem('windUnit', unit);
  };

  return (
    <SettingsContext.Provider value={{ unitSystem, windUnit, setUnitSystem, setWindUnit }}>
      {children}
    </SettingsContext.Provider>
  );
}
