'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/game/store/gameStore'
import GameBoard from '@/game/components/GameBoard'
import TurnOrderPanel from '@/game/components/TurnOrderPanel'
import UnitStatsPanel from '@/game/components/UnitStatsPanel'
import ActionBar from '@/game/components/ActionBar'
import VictoryScreen from '@/game/components/VictoryScreen'
import CombatLog from '@/game/components/CombatLog'

export default function GamePage() {
  const { initializeGame, phase } = useGameStore()
  
  useEffect(() => {
    initializeGame()
  }, [initializeGame])
  
  if (phase === 'victory' || phase === 'defeat') {
    return <VictoryScreen />
  }
  
  return (
    <div className="min-h-screen bg-gray-900 p-2 lg:p-4 flex flex-col">
      <div className="max-w-7xl mx-auto flex-1 flex flex-col">
        <h1 className="text-xl lg:text-2xl font-bold text-center mb-3 lg:mb-4">The Grudgekeeper - Tactical Combat</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px_300px] gap-3 lg:gap-4 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <GameBoard />
            <div className="flex-1 min-h-0 mt-3">
              <ActionBar />
            </div>
          </div>
          
          <div className="space-y-3">
            <UnitStatsPanel />
            <TurnOrderPanel />
          </div>
          
          <div className="h-[400px]">
            <CombatLog />
          </div>
        </div>
      </div>
    </div>
  )
}