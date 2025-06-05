'use client'

import { useRef, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { GRID_SIZE, CELL_SIZE, UNIT_COLORS, UNIT_INITIALS } from '../constants'
import { Position } from '../types'

export default function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    grid,
    units,
    currentUnitId,
    selectedAction,
    validMoves,
    validTargets,
    hoveredCell,
    moveUnit,
    attackUnit,
    hoverCell
  } = useGameStore()
  
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE)
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE)
    
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return
    
    const currentUnit = units.find(u => u.id === currentUnitId)
    if (!currentUnit) return
    
    if (selectedAction === 'move' && currentUnitId) {
      const isValidMove = validMoves.some(move => move.x === x && move.y === y)
      if (isValidMove) {
        moveUnit(currentUnitId, { x, y })
      }
    } else if (selectedAction === 'strike' && currentUnitId) {
      const targetUnit = units.find(u => u.position.x === x && u.position.y === y)
      if (targetUnit && validTargets.includes(targetUnit.id)) {
        attackUnit(currentUnitId, targetUnit.id)
      }
    }
  }
  
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE)
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE)
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      hoverCell({ x, y })
    } else {
      hoverCell(null)
    }
  }
  
  const handleMouseLeave = () => {
    hoverCell(null)
  }
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw grid
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = grid[y]?.[x]
        if (!cell) continue
        
        const pixelX = x * CELL_SIZE
        const pixelY = y * CELL_SIZE
        
        // Draw cell background
        if (cell.type === 'wall') {
          ctx.fillStyle = '#374151'
        } else if (cell.type === 'crate') {
          ctx.fillStyle = '#4B5563'
        } else if (cell.type === 'door') {
          ctx.fillStyle = '#6B7280'
        } else {
          ctx.fillStyle = '#1F2937'
        }
        ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE)
        
        // Highlight valid moves
        if (selectedAction === 'move') {
          const isValidMove = validMoves.some(move => move.x === x && move.y === y)
          if (isValidMove) {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
            ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE)
          }
        }
        
        // Highlight hovered cell
        if (hoveredCell && hoveredCell.x === x && hoveredCell.y === y) {
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.strokeRect(pixelX + 1, pixelY + 1, CELL_SIZE - 2, CELL_SIZE - 2)
        }
        
        // Draw grid lines
        ctx.strokeStyle = '#374151'
        ctx.lineWidth = 1
        ctx.strokeRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE)
      }
    }
    
    // Draw units
    units.forEach(unit => {
      if (unit.hp <= 0) return
      
      const pixelX = unit.position.x * CELL_SIZE + CELL_SIZE / 2
      const pixelY = unit.position.y * CELL_SIZE + CELL_SIZE / 2
      
      // Highlight valid targets
      if (selectedAction === 'strike' && validTargets.includes(unit.id)) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
        ctx.fillRect(
          unit.position.x * CELL_SIZE,
          unit.position.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        )
      }
      
      // Draw unit circle
      ctx.beginPath()
      ctx.arc(pixelX, pixelY, CELL_SIZE / 3, 0, Math.PI * 2)
      ctx.fillStyle = UNIT_COLORS[unit.class] || '#FFFFFF'
      ctx.fill()
      
      // Draw active unit border
      if (unit.isActive) {
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 3
        ctx.stroke()
      }
      
      // Draw unit initial
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 20px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(UNIT_INITIALS[unit.class] || '?', pixelX, pixelY)
      
      // Draw HP bar
      const barWidth = CELL_SIZE - 10
      const barHeight = 4
      const barX = unit.position.x * CELL_SIZE + 5
      const barY = unit.position.y * CELL_SIZE + 5
      
      ctx.fillStyle = '#000000'
      ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2)
      
      const hpPercent = unit.hp / unit.maxHp
      ctx.fillStyle = hpPercent > 0.5 ? '#10B981' : hpPercent > 0.25 ? '#F59E0B' : '#EF4444'
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight)
    })
  }, [grid, units, currentUnitId, selectedAction, validMoves, validTargets, hoveredCell])
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="cursor-pointer"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
}