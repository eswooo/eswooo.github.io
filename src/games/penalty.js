import { randInt } from '../lib/rng'
import { makeTextures } from './textures'

// 페널티킥 (Phaser): 드래그 슛 + 골키퍼 다이빙 + 골/선방 이펙트. 5슛, 점수=골 수.
export function createPenaltyGame(Phaser, parent, { width, height, onScore }) {
  const W = width
  const H = height
  const POST_L = W * 0.12
  const GOAL_W = W * 0.76
  const ZONE_W = GOAL_W / 3
  const GOAL_TOP = H * 0.07
  const GOAL_H = H * 0.4
  const GOAL_Y = GOAL_TOP + GOAL_H * 0.42
  const KEEP_Y = GOAL_TOP + GOAL_H * 0.74
  const BALL_HOME = { x: W / 2, y: H - 46 }
  const TOTAL = 5
  const zoneX = (z) => POST_L + (z + 0.5) * ZONE_W

  class Scene extends Phaser.Scene {
    create() {
      makeTextures(this, Phaser)
      this.score = 0
      this.shots = 0
      this.dragging = false
      this.shooting = false
      this.startX = 0
      this.startY = 0

      this.drawField()
      this.aim = this.add.graphics()

      this.shadow = this.add.ellipse(BALL_HOME.x, BALL_HOME.y + 14, 24, 7, 0x000000, 0.22)
      this.keeper = this.add.image(W / 2, KEEP_Y, 'keeper').setScale(0.95)
      this.ball = this.add.image(BALL_HOME.x, BALL_HOME.y, 'soccer').setScale(0.8)

      this.trail = this.add.particles(0, 0, 'spark', {
        follow: this.ball,
        lifespan: 240,
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.45, end: 0 },
        frequency: 26,
        blendMode: 'ADD',
        emitting: false,
      })
      this.burst = this.add.particles(0, 0, 'spark', {
        lifespan: 520,
        speed: { min: 80, max: 240 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        emitting: false,
      })

      this.scoreText = this.add.text(8, 6, '⚽ 0골', { fontSize: '16px', color: '#fff', fontStyle: 'bold' })
        .setStroke('#1f5d2a', 3)
      this.shotsText = this.add.text(W - 8, 6, `0/${TOTAL}`, { fontSize: '16px', color: '#fff' })
        .setOrigin(1, 0).setStroke('#1f5d2a', 3)
      this.hint = this.add.text(W / 2, H - 12, '공을 아래로 당겼다 놓기', { fontSize: '13px', color: '#eafff0' })
        .setOrigin(0.5).setStroke('#1f5d2a', 2)

      this.input.on('pointerdown', (p) => this.onDown(p))
      this.input.on('pointermove', (p) => this.onMove(p))
      this.input.on('pointerup', () => this.finishDrag())
      this.input.on('pointerupoutside', () => this.finishDrag()) // 캔버스 밖에서 손 떼도 처리
      // 최후 폴백: 창 밖으로 나가 떼는 경우까지 (저장된 델타로 발사)
      this.winUp = () => this.finishDrag()
      window.addEventListener('pointerup', this.winUp)
      this.events.once('shutdown', () => window.removeEventListener('pointerup', this.winUp))
    }

    drawField() {
      const g = this.add.graphics()
      // 잔디 모우 스트라이프
      for (let i = 0; i < 8; i++) {
        g.fillStyle(i % 2 ? 0x6fb353 : 0x66a94c, 1)
        g.fillRect(0, (H / 8) * i, W, H / 8 + 1)
      }
      // 페널티 박스 + 아크
      g.lineStyle(2, 0xffffff, 0.5)
      g.strokeRect(W * 0.06, GOAL_TOP, W * 0.88, GOAL_H + H * 0.28)
      // 골대 측면(입체)
      g.fillStyle(0xdfe6ee, 1)
      g.fillRect(POST_L - 6, GOAL_TOP, 6, GOAL_H)
      g.fillRect(POST_L + GOAL_W, GOAL_TOP, 6, GOAL_H)
      // 네트
      g.fillStyle(0xffffff, 0.06)
      g.fillRect(POST_L, GOAL_TOP, GOAL_W, GOAL_H)
      g.lineStyle(1, 0xffffff, 0.18)
      for (let x = POST_L; x <= POST_L + GOAL_W; x += 12) g.lineBetween(x, GOAL_TOP, x, GOAL_TOP + GOAL_H)
      for (let y = GOAL_TOP; y <= GOAL_TOP + GOAL_H; y += 12) g.lineBetween(POST_L, y, POST_L + GOAL_W, y)
      // 골대 프레임
      g.lineStyle(5, 0xffffff, 1)
      g.strokeRect(POST_L, GOAL_TOP, GOAL_W, GOAL_H)
    }

    onDown(p) {
      if (this.shooting) return
      this.dragging = true
      this.startX = p.x
      this.startY = p.y
      this.curDx = 0
      this.curDy = 0
    }

    onMove(p) {
      if (!this.dragging) return
      const dx = p.x - this.startX
      const dy = p.y - this.startY
      this.curDx = dx
      this.curDy = dy
      const len = Math.hypot(dx, dy)
      const k = Math.min(64, len) / (len || 1)
      this.ball.setPosition(BALL_HOME.x + dx * k, BALL_HOME.y + dy * k)
      // 조준 미리보기 + 파워
      this.aim.clear()
      if (dy > 0 && len > 10) {
        const targetX = Phaser.Math.Clamp(BALL_HOME.x + -dx * 1.7, POST_L + 14, POST_L + GOAL_W - 14)
        this.aim.fillStyle(0xffe000, 0.85)
        for (let t = 0.2; t < 1; t += 0.2) {
          this.aim.fillCircle(BALL_HOME.x + (targetX - BALL_HOME.x) * t, BALL_HOME.y + (GOAL_Y - BALL_HOME.y) * t, 3)
        }
        const pw = Math.min(len / 80, 1)
        this.aim.fillStyle(0x1f2330, 0.5)
        this.aim.fillRoundedRect(W / 2 - 40, H - 30, 80, 7, 3)
        this.aim.fillStyle(0xffe000, 1)
        this.aim.fillRoundedRect(W / 2 - 40, H - 30, 80 * pw, 7, 3)
      }
    }

    finishDrag() {
      if (!this.dragging) return
      this.dragging = false
      this.aim.clear()
      const dx = this.curDx
      const dy = this.curDy
      if (Math.hypot(dx, dy) < 22 || dy <= 0) {
        this.tweens.add({ targets: this.ball, x: BALL_HOME.x, y: BALL_HOME.y, duration: 150 })
        return
      }
      this.shoot(dx)
    }

    shoot(dx) {
      this.shooting = true
      this.hint.setVisible(false)
      const targetX = Phaser.Math.Clamp(BALL_HOME.x + -dx * 1.7, POST_L + 14, POST_L + GOAL_W - 14)
      const zone = Phaser.Math.Clamp(Math.floor((targetX - POST_L) / ZONE_W), 0, 2)
      const keeperZone = randInt(3)

      this.trail.emitting = true
      this.tweens.add({ targets: this.shadow, alpha: 0, duration: 300 })
      this.tweens.add({
        targets: this.ball,
        x: targetX,
        y: GOAL_Y,
        scale: 0.5,
        angle: this.ball.angle + 540,
        duration: 520,
        ease: 'Quad.out',
        onComplete: () => {
          this.trail.emitting = false
        },
      })
      // 키퍼 다이빙
      const rot = keeperZone === 0 ? -72 : keeperZone === 2 ? 72 : 0
      this.tweens.add({ targets: this.keeper, x: zoneX(keeperZone), angle: rot, duration: 440, ease: 'Quad.out' })
      this.tweens.add({ targets: this.keeper, y: KEEP_Y - 10, duration: 220, yoyo: true, ease: 'Quad.out' })

      this.time.delayedCall(560, () => {
        this.shots += 1
        this.shotsText.setText(`${this.shots}/${TOTAL}`)
        if (zone === keeperZone) {
          this.cameras.main.shake(120, 0.005)
          this.popText('🧤 선방!', '#ffe066')
        } else {
          this.score += 1
          this.scoreText.setText(`⚽ ${this.score}골`)
          this.cameras.main.shake(160, 0.008)
          this.cameras.main.flash(120, 255, 255, 255, false)
          this.burst.explode(22, targetX, GOAL_Y)
          this.netPulse(targetX)
          this.popText('⚽ GOAL!!', '#ffffff')
        }
        this.time.delayedCall(950, () => {
          if (this.shots >= TOTAL) onScore(this.score)
          else this.reset()
        })
      })
    }

    netPulse(x) {
      const n = this.add.ellipse(x, GOAL_Y, 30, 22, 0xffffff, 0.4).setScale(0.4)
      this.tweens.add({ targets: n, scale: 1.6, alpha: 0, duration: 360, ease: 'Quad.out', onComplete: () => n.destroy() })
    }

    reset() {
      this.shooting = false
      this.ball.setScale(0.8).setAngle(0).setPosition(BALL_HOME.x, BALL_HOME.y)
      this.shadow.setAlpha(0.22)
      this.tweens.add({ targets: this.keeper, x: W / 2, y: KEEP_Y, angle: 0, duration: 250 })
    }

    popText(text, color) {
      const t = this.add.text(W / 2, H * 0.4, text, { fontSize: '30px', color, fontStyle: 'bold' })
        .setOrigin(0.5).setStroke('#1f2330', 5).setScale(0)
      this.tweens.add({ targets: t, scale: 1.1, duration: 220, ease: 'Back.out' })
      this.tweens.add({ targets: t, y: H * 0.4 - 24, alpha: 0, duration: 800, delay: 280 })
      this.time.delayedCall(1100, () => t.destroy())
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: W,
    height: H,
    transparent: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
    scene: Scene,
  })
}
