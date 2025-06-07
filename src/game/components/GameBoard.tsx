'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { GRID_SIZE, CELL_SIZE, UNIT_COLORS, UNIT_INITIALS } from '../constants'
import { Position } from '../types'
import { getLineOfSight, getCoverPenalty } from '../utils/gridUtils'

// Animation types removed - now using combat log for all combat feedback

/**
 * Main game board component
 * Renders the tactical grid, units, and handles all game interactions
 * Uses Canvas API for efficient rendering
 */
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
    lastCombat,
    revealedCells,
    moveUnit,
    attackUnit,
    useAbility,
    aimAction,
    defendAction,
    hoverCell
  } = useGameStore()
  
  // Animation refs removed - now using combat log
  
  // Damage animations removed - now using combat log instead
  
  /**
   * Handles click events on the game board
   * Executes actions based on selected action type (move, strike, ability)
   */
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Convert mouse coordinates to grid coordinates
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE)
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE)
    
    // Validate grid bounds
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return
    
    const currentUnit = units.find(u => u.id === currentUnitId)
    if (!currentUnit) return
    
    // Handle movement action
    if (selectedAction === 'move' && currentUnitId) {
      const isValidMove = validMoves.some(move => move.x === x && move.y === y)
      if (isValidMove) {
        moveUnit(currentUnitId, { x, y })
      }
    } 
    // Handle attack action
    else if (selectedAction === 'strike' && currentUnitId) {
      const targetUnit = units.find(u => u.position.x === x && u.position.y === y)
      if (targetUnit && validTargets.includes(targetUnit.id)) {
        attackUnit(currentUnitId, targetUnit.id)
      }
    } 
    // Handle special abilities
    else if (selectedAction === 'ability' && currentUnitId) {
      if (currentUnit && (currentUnit.class === 'delver' || currentUnit.class === 'engineer')) {
        // Position-targeted abilities (Ore Scanner, Deploy Turret)
        const isValidPosition = validMoves.some(pos => pos.x === x && pos.y === y)
        if (isValidPosition) {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useAbility(currentUnitId, undefined, { x, y })
        }
      } else {
        // Unit-targeted abilities (Shield Wall, Combat Brew)
        const targetUnit = units.find(u => u.position.x === x && u.position.y === y)
        if (targetUnit && validTargets.includes(targetUnit.id)) {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useAbility(currentUnitId, targetUnit.id)
        }
      }
    }
    // Handle aim action
    else if (selectedAction === 'aim' && currentUnitId) {
      const targetUnit = units.find(u => u.position.x === x && u.position.y === y)
      if (targetUnit && targetUnit.id === currentUnitId) {
        aimAction(currentUnitId)
      }
    }
    // Handle defend action
    else if (selectedAction === 'defend' && currentUnitId) {
      const targetUnit = units.find(u => u.position.x === x && u.position.y === y)
      if (targetUnit && targetUnit.id === currentUnitId) {
        defendAction(currentUnitId)
      }
    }
  }
  
  /**
   * Tracks mouse position for hover effects and targeting preview
   */
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
  
  // Extract current unit for reuse
  const currentUnit = units.find(u => u.id === currentUnitId)
  
  /**
   * Main rendering function using Canvas API
   * Draws layers in order: grid, highlights, units, UI elements, animations
   * Memoized to prevent unnecessary redraws
   */
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Layer 1: Clear canvas with dark background
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Layer 2: Draw grid cells
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = grid[y]?.[x]
        if (!cell) continue
        
        const pixelX = x * CELL_SIZE
        const pixelY = y * CELL_SIZE
        
        // Cell type determines color
        if (cell.type === 'wall') {
          ctx.fillStyle = '#374151'  // Dark gray for walls
        } else if (cell.type === 'crate') {
          ctx.fillStyle = '#4B5563'  // Medium gray for crates
        } else if (cell.type === 'door') {
          ctx.fillStyle = '#6B7280'  // Light gray for doors
        } else {
          ctx.fillStyle = '#1F2937'  // Floor color
        }
        ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE)
        
        // Highlight valid moves
        if (selectedAction === 'move' || (selectedAction === 'ability' && currentUnit && (currentUnit.class === 'delver' || currentUnit.class === 'engineer'))) {
          const isValidMove = validMoves.some(move => move.x === x && move.y === y)
          if (isValidMove) {
            ctx.fillStyle = selectedAction === 'move' 
              ? 'rgba(59, 130, 246, 0.3)'  // Blue for movement
              : currentUnit?.class === 'delver'
              ? 'rgba(168, 85, 247, 0.3)'  // Purple for scanner
              : 'rgba(245, 158, 11, 0.3)'  // Yellow for turret placement
            ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE)
          }
        }
        
        // Show revealed cells
        const isRevealed = revealedCells.some(pos => pos.x === x && pos.y === y)
        if (isRevealed) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.15)'
          ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE)
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
    
    // Draw range indicator when Strike is selected
    if (selectedAction === 'strike' && currentUnitId) {
      const currentUnit = units.find(u => u.id === currentUnitId)
      if (currentUnit) {
        const maxRange = currentUnit.rangeWeapon || 1
        
        // Draw range circle
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)'
        ctx.lineWidth = 2
        ctx.setLineDash([10, 5])
        ctx.beginPath()
        ctx.arc(
          currentUnit.position.x * CELL_SIZE + CELL_SIZE / 2,
          currentUnit.position.y * CELL_SIZE + CELL_SIZE / 2,
          maxRange * CELL_SIZE + CELL_SIZE / 2,
          0,
          Math.PI * 2
        )
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
    
    // Draw Line of Sight when hovering over a target
    if (selectedAction === 'strike' && hoveredCell && currentUnitId) {
      const currentUnit = units.find(u => u.id === currentUnitId)
      const targetUnit = units.find(u => 
        u.position.x === hoveredCell.x && 
        u.position.y === hoveredCell.y &&
        validTargets.includes(u.id)
      )
      
      if (currentUnit && targetUnit) {
        // Draw line from attacker to target
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(
          currentUnit.position.x * CELL_SIZE + CELL_SIZE / 2,
          currentUnit.position.y * CELL_SIZE + CELL_SIZE / 2
        )
        ctx.lineTo(
          targetUnit.position.x * CELL_SIZE + CELL_SIZE / 2,
          targetUnit.position.y * CELL_SIZE + CELL_SIZE / 2
        )
        ctx.stroke()
        ctx.setLineDash([])
        
        // Show cover penalty
        const coverPenalty = getCoverPenalty(currentUnit.position, targetUnit.position, grid)
        if (coverPenalty > 0) {
          ctx.fillStyle = '#000000'
          ctx.fillRect(
            targetUnit.position.x * CELL_SIZE + CELL_SIZE - 25,
            targetUnit.position.y * CELL_SIZE + 5,
            20,
            20
          )
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 14px monospace'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            `-${coverPenalty}`,
            targetUnit.position.x * CELL_SIZE + CELL_SIZE - 15,
            targetUnit.position.y * CELL_SIZE + 15
          )
        }
      }
    }
    
    // Draw units
    units.forEach(unit => {
      if (unit.hp <= 0) return
      
      // Use animation position if animating, otherwise use actual position
      let drawX = unit.position.x
      let drawY = unit.position.y
      
      if (unit.animationPosition && unit.animationTarget && unit.animationProgress !== undefined) {
        // Check if this is an attack animation (small bump)
        const isAttackAnim = Math.abs(unit.animationTarget.x - unit.position.x) < 1 &&
                           Math.abs(unit.animationTarget.y - unit.position.y) < 1
        
        let progress = unit.animationProgress
        if (isAttackAnim && progress > 1) {
          // For attack animations, reverse after midpoint
          progress = 2 - progress
        }
        
        // Interpolate between animation position and target
        drawX = unit.animationPosition.x + (unit.animationTarget.x - unit.animationPosition.x) * progress
        drawY = unit.animationPosition.y + (unit.animationTarget.y - unit.animationPosition.y) * progress
        
      }
      
      const pixelX = drawX * CELL_SIZE + CELL_SIZE / 2
      const pixelY = drawY * CELL_SIZE + CELL_SIZE / 2
      
      // Highlight valid targets
      if ((selectedAction === 'strike' || selectedAction === 'ability') && validTargets.includes(unit.id)) {
        ctx.fillStyle = selectedAction === 'strike' 
          ? 'rgba(239, 68, 68, 0.3)'  // Red for enemies
          : 'rgba(59, 130, 246, 0.3)' // Blue for allies
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
      
      // Draw status effect indicators
      const shieldWall = unit.statusEffects.find(e => e.type === 'shieldWall')
      if (shieldWall) {
        ctx.strokeStyle = '#3B82F6'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(pixelX, pixelY, CELL_SIZE / 3 + 4, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      const aimed = unit.statusEffects.find(e => e.type === 'aimed')
      if (aimed) {
        ctx.strokeStyle = '#F59E0B'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 3])
        ctx.beginPath()
        ctx.arc(pixelX, pixelY, CELL_SIZE / 3 + 8, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
      
      const defending = unit.statusEffects.find(e => e.type === 'defending')
      if (defending) {
        ctx.strokeStyle = '#10B981'
        ctx.lineWidth = 3
        ctx.beginPath()
        // Draw a square around the unit for defending
        const size = CELL_SIZE / 3 + 6
        ctx.strokeRect(pixelX - size, pixelY - size, size * 2, size * 2)
      }
      
      // Draw unit initial
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 20px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(UNIT_INITIALS[unit.class] || '?', pixelX, pixelY)
      
      // Draw HP bar at the same position as the animated unit
      const barWidth = CELL_SIZE - 10
      const barHeight = 4
      const barX = drawX * CELL_SIZE + 5
      const barY = drawY * CELL_SIZE + 5
      
      ctx.fillStyle = '#000000'
      ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2)
      
      const hpPercent = unit.hp / unit.maxHp
      ctx.fillStyle = hpPercent > 0.5 ? '#10B981' : hpPercent > 0.25 ? '#F59E0B' : '#EF4444'
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight)
    })
    
    // Damage animations removed - now displayed in combat log
  }, [grid, units, currentUnitId, selectedAction, validMoves, validTargets, hoveredCell, revealedCells, currentUnit])
  
  // Main render effect - only redraws when game state changes
  useEffect(() => {
    drawGame()
  }, [drawGame])
  
  // Animation loop for smooth unit movement
  useEffect(() => {
    let animationFrameId: number
    
    const animate = () => {
      const store = useGameStore.getState()
      let hasAnimations = false
      
      // Check if any units need animation updates
      const needsUpdate = store.units.some(unit => 
        unit.animationProgress !== undefined && unit.animationProgress < 2
      )
      
      if (needsUpdate) {
        hasAnimations = true
        
        // Update animation progress for all units
        useGameStore.setState(state => ({
          ...state,
          units: state.units.map(unit => {
            if (unit.animationProgress !== undefined && unit.animationProgress < 2) {
              // Smooth animation over 300ms for movement, 600ms for attack (bump out and back)
              const increment = 0.08
              const newProgress = unit.animationProgress + increment
              
              return {
                ...unit,
                animationProgress: newProgress >= 2 ? undefined : newProgress,
                // Clear animation when complete
                animationPosition: newProgress >= 2 ? undefined : unit.animationPosition,
                animationTarget: newProgress >= 2 ? undefined : unit.animationTarget
              }
            }
            return unit
          })
        }))
      }
      
      // Continue animation loop if there are active animations
      if (hasAnimations) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }
    
    // Start the animation loop
    animationFrameId = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])
  
  return (
    <div className="bg-gray-800 p-2 lg:p-3 rounded-lg shadow-lg">
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