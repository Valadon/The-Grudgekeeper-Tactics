'use client'

import { useEffect, useState } from 'react'

interface DiceRollProps {
  roll: number
  bonus: number
  penalty: number
  targetAC: number
  hit: boolean
  critical: boolean
  damage: number
  onComplete: () => void
}

export default function DiceRoll({
  roll,
  bonus,
  penalty,
  targetAC,
  hit,
  critical,
  damage,
  onComplete
}: DiceRollProps) {
  const [visible, setVisible] = useState(true)
  const [showResult, setShowResult] = useState(false)
  
  useEffect(() => {
    // Show dice roll for a moment
    const timer1 = setTimeout(() => {
      setShowResult(true)
    }, 500)
    
    // Hide after showing result
    const timer2 = setTimeout(() => {
      setVisible(false)
      onComplete()
    }, 2500)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [onComplete])
  
  if (!visible) return null
  
  const total = roll + bonus - penalty
  
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 shadow-2xl min-w-[300px]">
        <div className="text-center">
          {/* Dice animation */}
          <div className="mb-4">
            <div className={`inline-block text-6xl font-bold ${
              roll === 20 ? 'text-yellow-400 animate-pulse' : 
              roll === 1 ? 'text-red-600' : 
              'text-white'
            }`}>
              {roll}
            </div>
          </div>
          
          {/* Roll breakdown */}
          {showResult && (
            <>
              <div className="text-gray-300 mb-2">
                <span className="text-white">{roll}</span>
                {bonus > 0 && <span className="text-green-400"> +{bonus}</span>}
                {penalty > 0 && <span className="text-red-400"> -{penalty}</span>}
                <span className="text-gray-500"> = </span>
                <span className="text-white font-bold">{total}</span>
                <span className="text-gray-500"> vs AC </span>
                <span className="text-white">{targetAC}</span>
              </div>
              
              {/* Result */}
              <div className={`text-2xl font-bold mb-2 ${
                critical ? 'text-yellow-400' : 
                hit ? 'text-green-400' : 
                'text-red-400'
              }`}>
                {critical ? 'CRITICAL HIT!' : hit ? 'HIT!' : 'MISS!'}
              </div>
              
              {/* Damage */}
              {hit && (
                <div className="text-white">
                  <span className="text-2xl font-bold">{damage}</span>
                  <span className="text-gray-400"> damage</span>
                  {critical && <span className="text-yellow-400 text-sm ml-2">(x2)</span>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}