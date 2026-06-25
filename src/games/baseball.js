import { randInt } from '../lib/rng'
import { makeTextures } from './textures'

const TYPES = [
  { weight: 42, travel: [680, 850], curve: 0 },
  { weight: 22, travel: [450, 600], curve: 0 },
  { weight: 21, travel: [740, 920], curve: 64 },
  { weight: 15, travel: [980, 1240], curve: 24 },
]
function pickType() {
  const total = TYPES.reduce((s, t) => s + t.weight, 0)
  let r = randInt(total)
  for (const t of TYPES) {
    if (r < t.weight) return t
    r -= t.weight
  }
  return TYPES[0]
}

// 야구 타격 (Phaser): 원근 투구 + 스윙/타격 이펙트. 20구, 홈런4/안타1. 끝나면 onScore(score).
export function createBaseballGame(Phaser, parent, { width, height, onScore }) {
  const W = width
  const H = height
  const FAR_Y = 44
  const NEAR_Y = H - 96
  const TOTAL = 20

  class Scene extends Phaser.Scene {
    create() {
      makeTextures(this, Phaser)
      this.score = 0
      this.pitches = 0
      this.swung = false
      this.active = false
      this.travel = 800
      this.curveAmp = 0
      this.curveDir = 1
      this.spin = 0

      this.drawField()

      this.shadow = this.add.ellipse(W / 2, NEAR_Y + 16, 26, 8, 0x000000, 0.22)
      this.ball = this.add.image(W / 2, FAR_Y, 'bb_ball').setScale(0.35)
      // 타자 손(피벗)을 플레이트 아래, 공 하나만큼 왼쪽에 → 스윙이 호를 그리며 가운데(공)를 지나감
      this.bat = this.add.image(W / 2 - 34, NEAR_Y + 70, 'bat').setOrigin(0.08, 0.5).setAngle(-35).setScale(1.5)

      this.trail = this.add.particles(0, 0, 'spark', {
        follow: this.ball,
        lifespan: 260,
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.5, end: 0 },
        frequency: 28,
        blendMode: 'ADD',
        emitting: false,
      })
      this.burst = this.add.particles(0, 0, 'spark', {
        lifespan: 520,
        speed: { min: 90, max: 260 },
        scale: { start: 1.1, end: 0 },
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        emitting: false,
      })

      this.scoreText = this.add.text(8, 6, '⚾ 0점', { fontSize: '16px', color: '#fff', fontStyle: 'bold' })
        .setStroke('#1f2330', 3)
      this.countText = this.add.text(W - 8, 6, `0/${TOTAL}`, { fontSize: '16px', color: '#fff' })
        .setOrigin(1, 0).setStroke('#1f2330', 3)

      this.input.on('pointerdown', () => this.swing())
      this.time.delayedCall(700, () => this.pitch())
    }

    drawField() {
      const g = this.add.graphics()
      g.fillStyle(0x84c45f, 1)
      g.fillRect(0, 0, W, H)
      // 관중석
      g.fillStyle(0x2f3440, 1)
      g.fillRect(0, 0, W, H * 0.13)
      for (let i = 0; i < 70; i++) {
        const c = [0xff6b6b, 0xffd166, 0x4dabf7, 0xffffff, 0xff922b][randInt(5)]
        g.fillStyle(c, 0.8)
        g.fillRect(randInt(W), randInt(Math.floor(H * 0.12)), 3, 3)
      }
      // 내야 흙
      g.fillStyle(0xcf9b5b, 1)
      g.fillEllipse(W / 2, H * 1.02, W * 1.5, H * 0.72)
      // 파울 라인 + 홈플레이트
      g.lineStyle(3, 0xffffff, 0.8)
      g.lineBetween(W / 2, NEAR_Y, 10, H)
      g.lineBetween(W / 2, NEAR_Y, W - 10, H)
      g.fillStyle(0xffffff, 1)
      g.fillRect(W / 2 - 16, NEAR_Y - 4, 32, 8)
    }

    pitch() {
      const type = pickType()
      this.travel = type.travel[0] + randInt(type.travel[1] - type.travel[0])
      this.curveAmp = type.curve
      this.curveDir = randInt(2) ? 1 : -1
      this.spin = (type.curve > 40 ? 0.32 : 0.16) * (this.curveDir || 1)
      this.pitches += 1
      this.countText.setText(`${this.pitches}/${TOTAL}`)
      this.swung = false
      this.pitchStart = this.time.now
      this.ball.setAlpha(1).setScale(0.35).setAngle(0).setPosition(W / 2, FAR_Y)
      this.trail.emitting = true
      this.active = true
    }

    update(time) {
      if (!this.active) return
      const p = (time - this.pitchStart) / this.travel
      const pp = Math.min(p, 1)
      const cy = FAR_Y + (NEAR_Y - FAR_Y) * pp
      const sc = 0.35 + (1.5 - 0.35) * pp
      const cx = W / 2 + this.curveDir * this.curveAmp * Math.sin(pp * Math.PI)
      this.ball.setPosition(cx, cy).setScale(sc)
      this.ball.angle += this.spin * 16
      this.shadow.setPosition(cx, NEAR_Y + 16).setScale(sc, sc)
      if (!this.swung && p > 1.2) {
        this.active = false
        this.trail.emitting = false
        this.popText('💨 헛스윙!', '#ffe08a')
        this.tweens.add({ targets: [this.ball, this.shadow], alpha: 0, duration: 250 })
        this.afterResult()
      }
    }

    swing() {
      if (!this.active || this.swung) return
      this.swung = true
      this.active = false
      this.trail.emitting = false
      this.tweens.add({ targets: this.bat, angle: -145, duration: 130, yoyo: true, ease: 'Cubic.out' })
      const dt = Math.abs(this.time.now - (this.pitchStart + this.travel))
      if (dt < 30) {
        this.score += 4
        this.hit('🎉 홈런!', '#ffd43b', 26, 0.012)
      } else if (dt < 120) {
        this.score += 1
        this.hit('👍 안타!', '#8ce99a', 16, 0.006)
      } else {
        this.popText('💨 헛스윙!', '#ffe08a')
        this.tweens.add({ targets: [this.ball, this.shadow], alpha: 0, duration: 250 })
      }
      this.scoreText.setText(`⚾ ${this.score}점`)
      this.afterResult()
    }

    hit(text, color, particles, shake) {
      const bx = this.ball.x
      const by = this.ball.y
      this.cameras.main.shake(180, shake)
      this.cameras.main.flash(110, 255, 255, 255, false)
      this.burst.explode(particles, bx, by)
      const dir = randInt(2) ? 1 : -1
      this.tweens.add({ targets: this.shadow, alpha: 0, duration: 200 })
      this.tweens.add({ targets: this.ball, scaleX: 1.9, scaleY: 1.1, duration: 60, yoyo: true })
      this.tweens.add({
        targets: this.ball,
        x: W / 2 + dir * 240,
        y: -120,
        scale: 2.2,
        angle: this.ball.angle + 720,
        alpha: 0,
        duration: 560,
        ease: 'Quad.out',
        delay: 60,
      })
      this.popText(text, color)
    }

    popText(text, color) {
      const t = this.add.text(W / 2, H / 2, text, { fontSize: '30px', color, fontStyle: 'bold' })
        .setOrigin(0.5).setStroke('#1f2330', 5).setScale(0)
      this.tweens.add({ targets: t, scale: 1.1, duration: 220, ease: 'Back.out' })
      this.tweens.add({ targets: t, y: H / 2 - 26, alpha: 0, duration: 850, delay: 250 })
      this.time.delayedCall(1100, () => t.destroy())
    }

    afterResult() {
      this.time.delayedCall(1050, () => {
        if (this.pitches >= TOTAL) onScore(this.score)
        else this.pitch()
      })
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
