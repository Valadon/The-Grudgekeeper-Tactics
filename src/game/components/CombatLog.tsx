'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

export default function CombatLog() {
  const combatLog = useGameStore(state => state.combatLog)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    const scrollElement = scrollRef.current
    if (scrollElement && combatLog.length > 0) {
      // Use requestAnimationFrame to ensure DOM has fully updated
      requestAnimationFrame(() => {
        // Method 1: Set scrollTop directly
        scrollElement.scrollTop = scrollElement.scrollHeight
        
        // Method 2: If direct scrollTop doesn't work, use scrollIntoView as fallback
        const lastChild = scrollElement.lastElementChild
        if (lastChild && scrollElement.scrollTop !== scrollElement.scrollHeight - scrollElement.clientHeight) {
          lastChild.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      })
    }
  }, [combatLog]) // Watch the entire combatLog array
  
  return (
    <div className="bg-gray-800 p-3 rounded-lg shadow-lg h-full max-h-full">
      <h3 className="text-base font-semibold mb-2">Combat Log</h3>
      <div 
        ref={scrollRef}
        className="text-sm font-mono p-2 border border-gray-600"
        style={{ 
          height: '320px',
          overflowY: 'scroll',
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #1F2937'
        }}
      >
        <div className="space-y-1">
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
    </div>
  )
}