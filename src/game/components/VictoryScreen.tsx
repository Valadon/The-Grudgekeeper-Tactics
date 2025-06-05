'use client'

import { useGameStore } from '../store/gameStore'

export default function VictoryScreen() {
  const { phase, restartGame } = useGameStore()
  
  const isVictory = phase === 'victory'
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md">
        <h1 className={`text-4xl font-bold mb-4 ${isVictory ? 'text-green-500' : 'text-red-500'}`}>
          {isVictory ? 'Victory!' : 'Defeat!'}
        </h1>
        
        <p className="text-xl mb-8">
          {isVictory 
            ? 'The dwarves have emerged victorious! Rock and Stone!'
            : 'The expedition has failed. The Grudgekeeper is displeased.'
          }
        </p>
        
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