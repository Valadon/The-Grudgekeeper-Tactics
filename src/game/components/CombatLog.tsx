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
        {combatLog.map((entry, index) => (
          <div 
            key={index} 
            className={`p-2 rounded ${
              entry.type === 'attack' ? 'bg-gray-700' :
              entry.type === 'damage' ? 'bg-red-900/30' :
              entry.type === 'heal' ? 'bg-green-900/30' :
              entry.type === 'ability' ? 'bg-blue-900/30' :
              entry.type === 'move' ? 'bg-gray-700/50' :
              'bg-gray-700/30'
            }`}
          >
            <div className="text-gray-400 text-xs">Round {entry.round}</div>
            <div className="text-white">{entry.message}</div>
            {entry.details && (
              <div className="text-gray-400 text-xs mt-1">{entry.details}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}