'use client'

import { useGameStore } from '../store/gameStore'
import { getUnitDisplayName } from '../utils/unitUtils'

export default function UnitStatsPanel() {
  const { currentUnitId, units } = useGameStore()
  
  const currentUnit = units.find(u => u.id === currentUnitId)
  
  if (!currentUnit) {
    return null
  }
  
  return (
    <div className="bg-gray-800 p-3 rounded-lg shadow-lg">
      <h3 className="text-base font-semibold mb-2">Current Unit</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Name:</span>
          <span className="font-medium">{getUnitDisplayName(currentUnit)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">HP:</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(currentUnit.hp / currentUnit.maxHp) * 100}%` }}
              />
            </div>
            <span className="text-sm">{currentUnit.hp}/{currentUnit.maxHp}</span>
          </div>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">AC:</span>
          <span>{currentUnit.ac}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Speed:</span>
          <span>{currentUnit.speed} squares</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Attack:</span>
          <span>+{currentUnit.attackBonus}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Damage:</span>
          <span>{currentUnit.damage}</span>
        </div>
        
        {currentUnit.rangeWeapon && (
          <div className="flex justify-between">
            <span className="text-gray-400">Range:</span>
            <span>{currentUnit.rangeWeapon} squares</span>
          </div>
        )}
        
        <div className="pt-3 mt-3 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Actions:</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < currentUnit.actionsRemaining
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}