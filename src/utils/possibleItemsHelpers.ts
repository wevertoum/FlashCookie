import { type Unit, Unit as UnitEnum } from '../types';

export const UNIT_LABELS: Record<Unit, string> = {
  [UnitEnum.KG]: 'kg',
  [UnitEnum.G]: 'g',
  [UnitEnum.L]: 'L',
  [UnitEnum.ML]: 'mL',
  [UnitEnum.UN]: 'un',
  [UnitEnum.DUZIA]: 'duzia',
};

export const getCompatibleUnits = (unit: Unit): Unit[] => {
  if (unit === UnitEnum.KG || unit === UnitEnum.G) {
    return [UnitEnum.KG, UnitEnum.G];
  }
  if (unit === UnitEnum.L || unit === UnitEnum.ML) {
    return [UnitEnum.L, UnitEnum.ML];
  }
  return [unit];
};

export const formatNumber = (value: number): string => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return '0';
  }

  if (Number.isInteger(value)) {
    return value.toString();
  }

  const rounded = Math.round(value * 1000000) / 1000000;
  const formatted = rounded.toString();

  if (formatted.includes('.')) {
    return formatted.replace(/\.?0+$/, '');
  }

  return formatted;
};
