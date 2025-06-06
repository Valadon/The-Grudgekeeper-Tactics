'use client'

import { useGameStore } from '../store/gameStore'
import { getUnitDisplayName } from '../utils/unitUtils'
import { UNIT_COLORS } from '../constants'

export default function TurnOrderPanel() {
  const { turnOrder, units, currentUnitId, round } = useGameStore()
  
  const orderedUnits = turnOrder
    .map(id => units.find(u => u.id === id))
    .filter(unit => unit && unit.hp > 0)
  
  return (
    <div className="bg-gray-800 p-3 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold">Turn Order</h3>
        <span className="text-sm text-gray-400">Round {round}</span>
      </div>
      
      <div className="space-y-2">
        {orderedUnits.map((unit, index) => {
          if (!unit) return null
          
          return (
            <div
              key={unit.id}
              className={`
                flex items-center gap-3 p-2 rounded
                ${unit.id === currentUnitId ? 'bg-gray-700 ring-2 ring-blue-500' : ''}
              `}
            >
              <span className="text-sm text-gray-400 w-6">#{index + 1}</span>
              
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: UNIT_COLORS[unit.class] }}
              />
              
              <span className="flex-1 text-sm">
                {getUnitDisplayName(unit)}
              </span>
              
              <span className="text-xs text-gray-400">
                {unit.hp}/{unit.maxHp}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}