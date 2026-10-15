export type CriticalResult = {
  gain: number
  critical: boolean
}

export class AuraSystem {
  private aura = 0
  private rebirths = 0

  // Временный множитель (награда за рекламу)
  private boostMultiplier = 1

  private readonly criticalChance = 0.05
  private readonly criticalMultiplier = 3

  // ---------- Баланс перерождения ----------
  // Сколько ауры нужно для первого перерождения
  private readonly rebirthBaseRequirement = 250_000
  // Во сколько раз требование растёт после каждого перерождения
  private readonly rebirthRequirementGrowth = 3
  // Постоянный бонус к ауре за каждое перерождение (+50%)
  private readonly rebirthPower = 0.5

  // ---------- AURA ----------

  getAura(): number {
    return this.aura
  }

  setAura(value: number) {
    this.aura = Math.max(0, value)
  }

  addAura(amount: number) {
    this.aura += Math.max(0, amount)
  }

  spendAura(amount: number): boolean {
    if (this.aura < amount) {
      return false
    }

    this.aura -= amount

    return true
  }

  // ---------- REBIRTH ----------

  getRebirths(): number {
    return this.rebirths
  }

  setRebirths(count: number) {
    this.rebirths = Math.max(0, Math.floor(count))
  }

  getRebirthMultiplier(count: number = this.rebirths): number {
    return 1 + count * this.rebirthPower
  }

  getRebirthRequirement(): number {
    return Math.floor(
      this.rebirthBaseRequirement *
        Math.pow(this.rebirthRequirementGrowth, this.rebirths),
    )
  }

  canRebirth(): boolean {
    return this.aura >= this.getRebirthRequirement()
  }

  /**
   * Повышает счётчик перерождений.
   * keepProgress = true (перерождение за рекламу) — аура остаётся.
   * Движения сбрасывает GameScene.
   */
  rebirth(keepProgress = false): boolean {
    if (!this.canRebirth()) {
      return false
    }

    if (!keepProgress) {
      this.aura = 0
    }

    this.rebirths += 1

    return true
  }

  // ---------- BOOST ----------

  setBoostMultiplier(value: number) {
    this.boostMultiplier = Math.max(1, value)
  }

  getBoostMultiplier(): number {
    return this.boostMultiplier
  }

  // ---------- CRITICAL ----------

  calculateCritical(auraGain: number): CriticalResult {
    const critical = Math.random() < this.criticalChance

    if (critical) {
      return { gain: auraGain * this.criticalMultiplier, critical: true }
    }

    return { gain: auraGain, critical: false }
  }

  // ---------- FINAL GAIN ----------

  calculateAuraGain(baseAuraGain: number): CriticalResult & { finalGain: number } {
    const criticalResult = this.calculateCritical(baseAuraGain)

    const finalGain = Math.floor(
      criticalResult.gain * this.getRebirthMultiplier() * this.boostMultiplier,
    )

    return { ...criticalResult, finalGain }
  }
}
