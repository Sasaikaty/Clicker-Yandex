import { MOVEMENTS, type Movement } from '../data/movements'

import { AuraSystem, type CriticalResult } from './AuraSystem'

import { ComboSystem } from './ComboSystem'

export type PerformMovementResult = CriticalResult & {
  auraGain: number
}

export type MovementUnlockResult = {
  success: boolean
  unlocked: boolean
  equipped: boolean
  reason: 'equipped' | 'unlocked' | 'not-enough-aura'
}

export class MovementSystem {
  private currentMovement: Movement = MOVEMENTS[0]

  private unlockedMovements: string[] = ['stare']

  private readonly auraSystem: AuraSystem
  private readonly comboSystem: ComboSystem

  constructor(auraSystem: AuraSystem, comboSystem: ComboSystem) {
    this.auraSystem = auraSystem
    this.comboSystem = comboSystem
  }

  // =========================================================
  // CURRENT MOVEMENT
  // =========================================================

  getCurrentMovement(): Movement {
    return this.currentMovement
  }

  setCurrentMovement(movement: Movement) {
    this.currentMovement = movement
  }

  // =========================================================
  // UNLOCKED MOVEMENTS
  // =========================================================

  getUnlockedMovements(): string[] {
    return [...this.unlockedMovements]
  }

  setUnlockedMovements(movementIds: string[]) {
    this.unlockedMovements = movementIds.length > 0 ? [...movementIds] : ['stare']

    if (!this.unlockedMovements.includes('stare')) {
      this.unlockedMovements.push('stare')
    }
  }

  isUnlocked(movementId: string): boolean {
    return this.unlockedMovements.includes(movementId)
  }

  // =========================================================
  // HANDLE MOVEMENT
  // =========================================================

  handleMovementClick(movement: Movement): MovementUnlockResult {
    if (this.isUnlocked(movement.id)) {
      this.currentMovement = movement

      return {
        success: true,
        unlocked: true,
        equipped: true,
        reason: 'equipped',
      }
    }

    if (this.auraSystem.getAura() < movement.cost) {
      return {
        success: false,
        unlocked: false,
        equipped: false,
        reason: 'not-enough-aura',
      }
    }

    const spent = this.auraSystem.spendAura(movement.cost)

    if (!spent) {
      return {
        success: false,
        unlocked: false,
        equipped: false,
        reason: 'not-enough-aura',
      }
    }

    this.unlockedMovements.push(movement.id)

    this.currentMovement = movement

    return {
      success: true,
      unlocked: true,
      equipped: true,
      reason: 'unlocked',
    }
  }

  // =========================================================
  // PERFORM MOVEMENT
  // =========================================================

  performMovement(): PerformMovementResult {
    this.comboSystem.addCombo()

    const baseAuraGain = this.currentMovement.aura * this.comboSystem.getCombo()

    const result = this.auraSystem.calculateAuraGain(baseAuraGain)

    this.auraSystem.addAura(result.finalGain)

    return {
      gain: result.gain,
      critical: result.critical,
      auraGain: result.finalGain,
    }
  }
}
