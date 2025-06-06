'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

export default function CombatLog() {
  const combatLog = useGameStore(state => state.combatLog)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [combatLog])
  
  return (
    <div className="bg-gray-800 p-3 rounded-lg shadow-lg h-full flex flex-col">
      <h3 className="text-base font-semibold mb-2">Combat Log</h3>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 text-sm font-mono"
        style={{ maxHeight: '400px' }}
      >
        {combatLog.length === 0 && (
          <div className="text-gray-500 italic">Battle begins...</div>
        )}
{combatLog.map((entry, index) => {
          const prevEntry = index > 0 ? combatLog[index - 1] : null
          const showRound = !prevEntry || prevEntry.round !== entry.round
          
          return (
            <div key={index}>
              {showRound && (
                <div className="text-yellow-400 text-sm font-bold mt-2 mb-1 border-b border-gray-600 pb-1">
                  Round {entry.round}
                </div>
              )}
              <div 
                className={`px-2 py-1 mb-1 text-sm ${
                  entry.type === 'move' ? 'text-blue-300' :
                  entry.type === 'damage' ? 'text-red-400 font-semibold' :
                  entry.type === 'miss' ? 'text-gray-400' :
                  entry.type === 'heal' ? 'text-green-400' :
                  entry.type === 'ability' ? 'text-purple-300' :
                  entry.type === 'system' ? 'text-yellow-300 italic' :
                  'text-white'
                }`}
              >
                <div>{entry.message}</div>
                {entry.details && entry.type !== 'system' && (
                  <div className="text-xs text-gray-400 ml-2">{entry.details}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}