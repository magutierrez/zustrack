'use client';

import React, { useState, useEffect } from 'react';
import { SettingsContext, UnitSystem, WindUnit } from '@/hooks/use-settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>('metric');
  const [windUnit, setWindUnitState] = useState<WindUnit>('kmh');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedSystem = localStorage.getItem('unitSystem') as UnitSystem;
    const savedWind = localStorage.getItem('windUnit') as WindUnit;
    if (savedSystem) setUnitSystemState(savedSystem);
    if (savedWind) setWindUnitState(savedWind);
    setMounted(true);
  }, []);

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
