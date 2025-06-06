'use client'

import { useGameStore } from '../store/gameStore'
import { ActionType } from '../types'
import { DWARF_STATS } from '../constants'

export default function ActionBar() {
  const { 
    currentUnitId, 
    units, 
    selectedAction, 
    selectAction, 
    endTurn 
  } = useGameStore()
  
  const currentUnit = units.find(u => u.id === currentUnitId)
  
  if (!currentUnit || (currentUnit.type !== 'dwarf' && currentUnit.type !== 'turret')) {
    return null
  }
  
  const stats = currentUnit.type === 'dwarf' 
    ? DWARF_STATS[currentUnit.class as keyof typeof DWARF_STATS]
    : null
  
  const actions: { type: ActionType; label: string; cost: number; disabled: boolean }[] = []
  
  if (currentUnit.type === 'turret') {
    // Turrets can only attack
    actions.push({
      type: 'strike',
      label: 'Strike',
      cost: 1,
      disabled: currentUnit.actionsRemaining < 1
    })
  } else {
    // Regular dwarf actions
    actions.push(
      {
        type: 'move',
        label: 'Move',
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1
      },
      {
        type: 'strike',
        label: 'Strike',
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1
      },
      {
        type: 'aim',
        label: 'Aim (+2 next Strike)',
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1
      },
      {
        type: 'defend',
        label: 'Defend (+2 AC)',
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1
      }
    )
    
    if (stats) {
      actions.push({
        type: 'ability',
        label: stats.abilityName,
        cost: stats.abilityCost,
        disabled: currentUnit.actionsRemaining < stats.abilityCost
      })
    }
  }
  
  return (
    <div className="bg-gray-800 p-3 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Actions</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm">Actions:</span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < currentUnit.actionsRemaining ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        {actions.map(action => (
          <button
            key={action.type}
            onClick={() => selectAction(action.type)}
            disabled={action.disabled}
            className={`
              px-3 py-2 rounded text-sm font-medium transition-colors
              ${selectedAction === action.type
                ? 'bg-blue-600 text-white'
                : action.disabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
              }
            `}
          >
            {action.label}
            <span className="block text-xs opacity-75">
              Cost: {action.cost}
            </span>
          </button>
        ))}
      </div>
      
      <button
        onClick={endTurn}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors"
      >
        End Turn
      </button>
    </div>
  )
}