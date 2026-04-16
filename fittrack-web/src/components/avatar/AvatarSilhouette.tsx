'use client';

import { AvatarParams } from '@/types';

interface Props {
  params: AvatarParams;
  size?: number;
}

/**
 * SVG-силуэт с морфом плеч/талии/бёдер по AvatarParams.
 * Это MVP fallback — Three.js голограф будет добавлен в следующей итерации.
 *
 * shaderUniforms (muscleDefinition / bodyFatLayer) визуализируются через
 * толщину обводки и непрозрачность fill.
 */
export function AvatarSilhouette({ params, size = 280 }: Props) {
  const cx = 100;

  // Базовые параметры (центр X = 100, рост 280 ↔ scale 1.0)
  const shoulder = 35 * params.shoulderWidth;
  const chest = 32 * params.chestDepth;
  const waist = 28 * params.waistWidth;
  const hip = 38 * params.hipWidth;
  const arm = 8 * params.armGirth;
  const thigh = 14 * params.thighGirth;

  // Цвета зависят от muscleDefinition (рельеф) и bodyFatLayer
  const fillOpacity = 0.7 - params.muscleDefinition * 0.2;
  const strokeWidth = 0.5 + params.muscleDefinition * 1.5;

  // bodyFatLayer влияет на оттенок: high fat → теплее, high def → холоднее
  const hue = 200 - params.muscleDefinition * 40 + params.bodyFatLayer * 20;
  const fill = `hsl(${hue}, 60%, 55%)`;
  const stroke = `hsl(${hue}, 70%, 35%)`;

  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 200 280"
      style={{ transform: `scale(${params.heightScale})` }}
    >
      {/* Голова */}
      <circle cx={cx} cy="20" r="12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {/* Шея */}
      <rect x={cx - 4} y="32" width="8" height="8" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />

      {/* Торс: трапеция плечи → грудь → талия */}
      <path
        d={`
          M ${cx - shoulder} 40
          L ${cx + shoulder} 40
          L ${cx + chest} 100
          L ${cx + waist} 140
          L ${cx - waist} 140
          L ${cx - chest} 100
          Z
        `}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Бёдра */}
      <path
        d={`
          M ${cx - waist} 140
          L ${cx + waist} 140
          L ${cx + hip} 175
          L ${cx - hip} 175
          Z
        `}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Левая рука */}
      <path
        d={`
          M ${cx - shoulder} 42
          L ${cx - shoulder - arm} 50
          L ${cx - shoulder - arm * 0.8} 130
          L ${cx - shoulder + 2} 125
          Z
        `}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Правая рука */}
      <path
        d={`
          M ${cx + shoulder} 42
          L ${cx + shoulder + arm} 50
          L ${cx + shoulder + arm * 0.8} 130
          L ${cx + shoulder - 2} 125
          Z
        `}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Левая нога */}
      <path
        d={`
          M ${cx - hip + 2} 175
          L ${cx - hip + 2 + thigh} 175
          L ${cx - hip + 2 + thigh * 0.7} 270
          L ${cx - hip + 2 - thigh * 0.2} 270
          Z
        `}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Правая нога */}
      <path
        d={`
          M ${cx + hip - 2 - thigh} 175
          L ${cx + hip - 2} 175
          L ${cx + hip - 2 + thigh * 0.2} 270
          L ${cx + hip - 2 - thigh * 0.7} 270
          Z
        `}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Hologram-эффект: scanlines */}
      <defs>
        <pattern id="scanlines" width="100%" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="2" x2="200" y2="2" stroke="#fff" strokeWidth="0.3" opacity="0.4" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="200" height="280" fill="url(#scanlines)" pointerEvents="none" />
    </svg>
  );
}
