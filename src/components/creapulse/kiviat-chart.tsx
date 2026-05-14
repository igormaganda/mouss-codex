'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface KiviatData {
  label: string
  value: number
  maxValue: number
}

interface KiviatChartProps {
  data: KiviatData[]
  size?: number
  colors?: {
    fill: string
    stroke: string
    grid: string
    label: string
    axis: string
    point: string
  }
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angle: number
) {
  const rad = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

export default function KiviatChart({
  data,
  size = 360,
  colors = {
    fill: 'rgba(16, 185, 129, 0.2)',
    stroke: '#10b981',
    grid: '#e5e7eb',
    label: '#374151',
    axis: '#d1d5db',
    point: '#059669',
  },
}: KiviatChartProps) {
  const [animatedValues, setAnimatedValues] = useState<number[]>(
    data.map(() => 0)
  )
  const cx = size / 2
  const cy = size / 2
  const maxRadius = size / 2 - 50
  const levels = 5
  const angleStep = 360 / data.length

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValues(data.map((d) => d.value))
    }, 300)
    return () => clearTimeout(timer)
  }, [data])

  // Generate polygon points
  const getDataPoints = () => {
    return animatedValues.map((val, i) => {
      const r = (val / 100) * maxRadius
      const angle = i * angleStep
      return polarToCartesian(cx, cy, r, angle)
    })
  }

  const dataPoints = getDataPoints()
  const dataPath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')
    + ' Z'

  const gridLevels = Array.from({ length: levels }, (_, i) => {
    const r = ((i + 1) / levels) * maxRadius
    const points = data.map((_, j) => {
      const angle = j * angleStep
      return polarToCartesian(cx, cy, r, angle)
    })
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ')
      + ' Z'
  })

  return (
    <div className="flex justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="max-w-full h-auto"
      >
        {/* Grid levels */}
        {gridLevels.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke={colors.grid}
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const angle = i * angleStep
          const end = polarToCartesian(cx, cy, maxRadius, angle)
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke={colors.axis}
              strokeWidth="1"
            />
          )
        })}

        {/* Data polygon */}
        <motion.path
          d={dataPath}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" as const }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="5"
            fill={colors.point}
            stroke="white"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 300 }}
          />
        ))}

        {/* Labels */}
        {data.map((d, i) => {
          const angle = i * angleStep
          const labelR = maxRadius + 32
          const pos = polarToCartesian(cx, cy, labelR, angle)
          const isRight = angle <= 180
          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor={isRight ? 'start' : 'end'}
              dominantBaseline="middle"
              fill={colors.label}
              fontSize="11"
              fontWeight="500"
              className="select-none"
            >
              {d.label}
            </text>
          )
        })}

        {/* Value labels inside */}
        {dataPoints.map((p, i) => (
          <motion.text
            key={i}
            x={p.x}
            y={p.y - 14}
            textAnchor="middle"
            fill={colors.point}
            fontSize="12"
            fontWeight="700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.08 }}
            className="select-none"
          >
            {animatedValues[i]}
          </motion.text>
        ))}
      </svg>
    </div>
  )
}
