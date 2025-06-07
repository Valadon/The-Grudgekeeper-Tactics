'use client'

import { useGameStore } from '../store/gameStore'
import { useMemo } from 'react'

export default function VictoryScreen() {
  const { phase, restartGame, units, round, combatLog } = useGameStore()
  
  const isVictory = phase === 'victory'
  
  // Calculate battle statistics
  const statistics = useMemo(() => {
    const stats = {
      roundsCompleted: round,
      dwarfCasualties: 0,
      enemiesDefeated: 0,
      damageDealt: 0,
      damageTaken: 0,
      hitsMade: 0,
      misses: 0,
      criticalHits: 0,
      healingDone: 0,
      abilitiesUsed: 0
    }
    
    // Count casualties
    units.forEach(unit => {
      if (unit.hp <= 0) {
        if (unit.type === 'dwarf') {
          stats.dwarfCasualties++
        } else if (unit.type === 'enemy') {
          stats.enemiesDefeated++
        }
      }
    })
    
    // Analyze combat log
    combatLog.forEach(entry => {
      if (entry.type === 'damage') {
        // Parse damage from message
        const damageMatch = entry.message.match(/for (\d+) damage/)
        if (damageMatch) {
          const damage = parseInt(damageMatch[1])
          if (entry.message.includes('Goblin') || entry.message.includes('Void Warg')) {
            stats.damageTaken += damage
          } else {
            stats.damageDealt += damage
          }
        }
        if (entry.details?.includes('CRITICAL')) {
          stats.criticalHits++
        }
        stats.hitsMade++
      } else if (entry.type === 'miss') {
        stats.misses++
      } else if (entry.type === 'heal') {
        const healMatch = entry.message.match(/heals .* for (\d+) HP/)
        if (healMatch) {
          stats.healingDone += parseInt(healMatch[1])
        }
      } else if (entry.type === 'ability') {
        stats.abilitiesUsed++
      }
    })
    
    return stats
  }, [units, round, combatLog])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-2xl">
        <h1 className={`text-4xl font-bold mb-4 ${isVictory ? 'text-green-500' : 'text-red-500'}`}>
          {isVictory ? 'Victory!' : 'Defeat!'}
        </h1>
        
        <p className="text-xl mb-6">
          {isVictory 
            ? 'The dwarves have emerged victorious! Rock and Stone!'
            : 'The expedition has failed. The Grudgekeeper is displeased.'
          }
        </p>
        
        {/* Battle Statistics */}
        <div className="bg-gray-700 rounded-lg p-6 mb-6 text-left">
          <h2 className="text-2xl font-semibold mb-4 text-center">Battle Report</h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">Combat Performance</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Rounds Survived:</span>
                  <span className="font-mono">{statistics.roundsCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hits Landed:</span>
                  <span className="font-mono">{statistics.hitsMade}</span>
                </div>
                <div className="flex justify-between">
                  <span>Attacks Missed:</span>
                  <span className="font-mono">{statistics.misses}</span>
                </div>
                <div className="flex justify-between">
                  <span>Critical Hits:</span>
                  <span className="font-mono text-yellow-400">{statistics.criticalHits}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-red-400 mb-2">Casualties & Damage</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Dwarf Casualties:</span>
                  <span className="font-mono">{statistics.dwarfCasualties}</span>
                </div>
                <div className="flex justify-between">
                  <span>Enemies Defeated:</span>
                  <span className="font-mono">{statistics.enemiesDefeated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Damage Dealt:</span>
                  <span className="font-mono text-green-400">{statistics.damageDealt}</span>
                </div>
                <div className="flex justify-between">
                  <span>Damage Taken:</span>
                  <span className="font-mono text-red-400">{statistics.damageTaken}</span>
                </div>
              </div>
            </div>
          </div>
          
          {(statistics.healingDone > 0 || statistics.abilitiesUsed > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <h3 className="font-semibold text-purple-400 mb-2">Special Actions</h3>
              <div className="space-y-1 text-sm">
                {statistics.healingDone > 0 && (
                  <div className="flex justify-between">
                    <span>HP Healed:</span>
                    <span className="font-mono text-green-400">{statistics.healingDone}</span>
                  </div>
                )}
                {statistics.abilitiesUsed > 0 && (
                  <div className="flex justify-between">
                    <span>Abilities Used:</span>
                    <span className="font-mono">{statistics.abilitiesUsed}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Hit Rate */}
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-sm">Hit Rate:</span>
              <span className="font-mono text-lg">
                {statistics.hitsMade + statistics.misses > 0 
                  ? `${Math.round((statistics.hitsMade / (statistics.hitsMade + statistics.misses)) * 100)}%`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={restartGame}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Play Again
          </button>
          
          <a
            href="/"
            className="block w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Return to Menu
          </a>
        </div>
      </div>
    </div>
  )
}