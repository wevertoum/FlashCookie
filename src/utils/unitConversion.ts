/**
 * RF-011, RF-019: Unit conversion utilities
 * RB-002: Conversion rules
 */

import { Unit } from '../types';

function convertMass(
  value: number,
  fromUnit: Unit.KG | Unit.G,
  toUnit: Unit.KG | Unit.G,
): number {
  if (fromUnit === toUnit) {
    return value;
  }

  if (fromUnit === Unit.KG && toUnit === Unit.G) {
    return value * 1000;
  }

  if (fromUnit === Unit.G && toUnit === Unit.KG) {
    return value / 1000;
  }

  return value;
}

function convertVolume(
  value: number,
  fromUnit: Unit.L | Unit.ML,
  toUnit: Unit.L | Unit.ML,
): number {
  if (fromUnit === toUnit) {
    return value;
  }

  if (fromUnit === Unit.L && toUnit === Unit.ML) {
    return value * 1000;
  }

  if (fromUnit === Unit.ML && toUnit === Unit.L) {
    return value / 1000;
  }

  return value;
}

/**
 * RB-002: Convert unit value to target unit
 */
export function convertUnit(
  value: number,
  fromUnit: Unit,
  toUnit: Unit,
): number {
  if (fromUnit === toUnit) {
    return value;
  }

  if (
    (fromUnit === Unit.KG || fromUnit === Unit.G) &&
    (toUnit === Unit.KG || toUnit === Unit.G)
  ) {
    return convertMass(
      value,
      fromUnit as Unit.KG | Unit.G,
      toUnit as Unit.KG | Unit.G,
    );
  }

  if (
    (fromUnit === Unit.L || fromUnit === Unit.ML) &&
    (toUnit === Unit.L || toUnit === Unit.ML)
  ) {
    return convertVolume(
      value,
      fromUnit as Unit.L | Unit.ML,
      toUnit as Unit.L | Unit.ML,
    );
  }

  return value;
}

export function normalizeUnit(unit: string): Unit {
  const normalized = unit.toLowerCase().trim();

  if (
    normalized === 'kg' ||
    normalized === 'quilograma' ||
    normalized === 'quilogramas' ||
    normalized === 'quilo' ||
    normalized === 'quilos' ||
    normalized === 'kilograma' ||
    normalized === 'kilogramas' ||
    normalized === 'kilo' ||
    normalized === 'kilos'
  ) {
    return Unit.KG;
  }

  if (
    normalized === 'g' ||
    normalized === 'grama' ||
    normalized === 'gramas' ||
    normalized === 'gr' ||
    normalized === 'gram'
  ) {
    return Unit.G;
  }

  if (
    normalized === 'l' ||
    normalized === 'litro' ||
    normalized === 'litros' ||
    normalized === 'lit' ||
    normalized === 'lts'
  ) {
    return Unit.L;
  }

  if (
    normalized === 'ml' ||
    normalized === 'mililitro' ||
    normalized === 'mililitros' ||
    normalized === 'mililitre' ||
    normalized === 'mililitres'
  ) {
    return Unit.ML;
  }

  if (
    normalized === 'un' ||
    normalized === 'unidade' ||
    normalized === 'unidades' ||
    normalized === 'pacote' ||
    normalized === 'pacotes' ||
    normalized === 'caixa' ||
    normalized === 'caixas' ||
    normalized === 'pct' ||
    normalized === 'pcts' ||
    normalized === 'cx' ||
    normalized === 'cxs' ||
    normalized === 'und' ||
    normalized === 'unds'
  ) {
    return Unit.UN;
  }

  if (
    normalized === 'duzia' ||
    normalized === 'dúzia' ||
    normalized === 'duzias' ||
    normalized === 'dúzias' ||
    normalized === 'dz' ||
    normalized === 'dza' ||
    normalized === 'dozen' ||
    normalized === 'dozens'
  ) {
    return Unit.DUZIA;
  }

  console.warn(`Unidade desconhecida "${unit}", usando "un" como padrão`);
  return Unit.UN;
}
