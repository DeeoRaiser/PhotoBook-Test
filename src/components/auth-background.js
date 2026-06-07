"use client"

import { useEffect, useRef } from "react"

export default function AuthBackground() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")

        let W = canvas.width  = window.innerWidth
        let H = canvas.height = window.innerHeight
        let animId

        const onResize = () => {
            W = canvas.width  = window.innerWidth
            H = canvas.height = window.innerHeight
        }
        window.addEventListener("resize", onResize)

        // ── Particle config ──────────────────────────────────────────
        const COUNT = 72
        const COLORS = ["rgba(148,163,184,", "rgba(100,116,139,", "rgba(203,213,225,", "rgba(226,232,240,"]

        class Particle {
            constructor() { this.reset(true) }

            reset(initial = false) {
                this.x    = Math.random() * W
                this.y    = initial ? Math.random() * H : H + 10
                this.r    = Math.random() * 1.8 + 0.4
                this.alpha= Math.random() * 0.5 + 0.15
                this.vx   = (Math.random() - 0.5) * 0.3
                this.vy   = -(Math.random() * 0.5 + 0.2)
                this.color= COLORS[Math.floor(Math.random() * COLORS.length)]
                this.pulse= Math.random() * Math.PI * 2   // phase offset for pulsing
                this.pspeed= Math.random() * 0.015 + 0.008
            }

            draw() {
                const a = this.alpha + Math.sin(this.pulse) * 0.12
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
                ctx.fillStyle = this.color + Math.max(0, Math.min(1, a)) + ")"
                ctx.fill()
            }

            update() {
                this.x     += this.vx
                this.y     += this.vy
                this.pulse += this.pspeed
                if (this.y < -10) this.reset()
            }
        }

        // ── Connections config ───────────────────────────────────────
        const MAX_DIST = 120

        const particles = Array.from({ length: COUNT }, () => new Particle())

        function drawConnections() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i], b = particles[j]
                    const dx = a.x - b.x, dy = a.y - b.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < MAX_DIST) {
                        const opacity = (1 - dist / MAX_DIST) * 0.12
                        ctx.beginPath()
                        ctx.moveTo(a.x, a.y)
                        ctx.lineTo(b.x, b.y)
                        ctx.strokeStyle = `rgba(148,163,184,${opacity})`
                        ctx.lineWidth = 0.6
                        ctx.stroke()
                    }
                }
            }
        }

        function loop() {
            ctx.clearRect(0, 0, W, H)
            drawConnections()
            particles.forEach(p => { p.update(); p.draw() })
            animId = requestAnimationFrame(loop)
        }

        loop()

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener("resize", onResize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 0,
            }}
        />
    )
}
