'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/game/store/gameStore'
import GameBoard from '@/game/components/GameBoard'
import TurnOrderPanel from '@/game/components/TurnOrderPanel'
import UnitStatsPanel from '@/game/components/UnitStatsPanel'
import ActionBar from '@/game/components/ActionBar'
import VictoryScreen from '@/game/components/VictoryScreen'
import DiceRoll from '@/game/components/DiceRoll'

export default function GamePage() {
  const { initializeGame, phase, lastCombat, clearLastCombat } = useGameStore()
  const [showDiceRoll, setShowDiceRoll] = useState(false)
  const [diceRollData, setDiceRollData] = useState<any>(null)
  
  useEffect(() => {
    initializeGame()
  }, [initializeGame])
  
  // Remove overflow hidden to allow scrolling when needed
  // This was causing dice rolls to be cut off
  
  useEffect(() => {
    if (lastCombat && !showDiceRoll) {
      setDiceRollData({
        roll: lastCombat.roll,
        bonus: lastCombat.bonus,
        penalty: lastCombat.coverPenalty,
        targetAC: lastCombat.targetAC,
        hit: lastCombat.hit,
        critical: lastCombat.critical,
        damage: lastCombat.damage
      })
      setShowDiceRoll(true)
    }
  }, [lastCombat, showDiceRoll])
  
  if (phase === 'victory' || phase === 'defeat') {
    return <VictoryScreen />
  }
  
  return (
    <div className="min-h-screen bg-gray-900 p-2 lg:p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl lg:text-2xl font-bold text-center mb-3 lg:mb-4">The Grudgekeeper - Tactical Combat</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 lg:gap-4">
          <div className="space-y-3">
            <GameBoard />
            <ActionBar />
          </div>
          
          <div className="space-y-3">
            <UnitStatsPanel />
            <TurnOrderPanel />
          </div>
        </div>
      </div>
      
      {showDiceRoll && diceRollData && (
        <DiceRoll
          {...diceRollData}
          onComplete={() => {
            setShowDiceRoll(false)
            clearLastCombat()
          }}
        />
      )}
    </div>
  )
}