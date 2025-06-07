'use client'

import { useGameStore } from '../store/gameStore'
import { ActionType } from '../types'
import { DWARF_STATS, MAP_PENALTIES } from '../constants'

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
  
  const handleActionClick = (actionType: ActionType) => {
    // All actions now use selectAction for consistency with the store's targeting system
    selectAction(actionType)
  }
  
  // Calculate MAP penalty for strike button display
  const mapPenalty = MAP_PENALTIES[Math.min(currentUnit.strikesThisTurn, MAP_PENALTIES.length - 1)]
  const strikeLabel = mapPenalty < 0 ? `Strike (${mapPenalty})` : 'Strike'

  const actions: { type: ActionType; label: string; cost: number; disabled: boolean }[] = []
  
  if (currentUnit.type === 'turret') {
    // Turrets can only attack
    actions.push({
      type: 'strike',
      label: strikeLabel,
      cost: 1,
      disabled: currentUnit.actionsRemaining < 1 || 
               Boolean(currentUnit.currentAmmo !== undefined && currentUnit.currentAmmo <= 0)
    })
  } else {
    // Regular dwarf actions
    actions.push(
      {
        type: 'step',
        label: 'Step (1 tile)',
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1
      },
      {
        type: 'stride',
        label: 'Stride (full move)',
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1
      },
      {
        type: 'strike',
        label: strikeLabel,
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1 || 
                 Boolean(currentUnit.rangeWeapon && currentUnit.currentAmmo !== undefined && currentUnit.currentAmmo <= 0)
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
      },
      {
        type: 'dropProne',
        label: 'Drop Prone',
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1
      },
      {
        type: 'takeCover',
        label: 'Take Cover',
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1
      },
      {
        type: 'brace',
        label: 'Brace',
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1
      }
    )
    
    // Add shield-specific action for Voidguard
    if (currentUnit.class === 'voidguard') {
      actions.push({
        type: 'raiseShield',
        label: 'Raise Shield (+2 AC)',
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1
      })
    }
    
    // Add reload action for ranged units with ammo
    if (stats?.weaponRange && currentUnit.maxAmmo !== undefined) {
      actions.push({
        type: 'reload',
        label: `Reload (${currentUnit.currentAmmo || 0}/${currentUnit.maxAmmo})`,
        cost: 1,
        disabled: currentUnit.actionsRemaining < 1 || 
                 (currentUnit.currentAmmo || 0) >= currentUnit.maxAmmo
      })
    }
    
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
    <div className="bg-gray-800 p-3 rounded-lg shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-base font-semibold">Actions</h3>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-blue-400">
            {currentUnit.actionsRemaining} / 3
          </span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 ${
                  i < currentUnit.actionsRemaining 
                    ? 'bg-blue-500 border-blue-400' 
                    : 'bg-gray-700 border-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-3">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
          {actions.map(action => (
            <button
              key={action.type}
              onClick={() => handleActionClick(action.type)}
              disabled={action.disabled}
              className={`
                px-2 py-2 rounded text-xs font-medium transition-colors min-h-[3rem] flex flex-col justify-center
                ${selectedAction === action.type
                  ? 'bg-blue-600 text-white'
                  : action.disabled
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
                }
              `}
            >
              <span className="leading-tight text-center">{action.label}</span>
              <span className="text-[10px] opacity-75 mt-1 text-center">
                Cost: {action.cost}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <button
        onClick={endTurn}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors flex-shrink-0"
      >
        End Turn
      </button>
    </div>
  )
}