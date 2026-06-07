"use client"

import { useEffect, useRef } from "react"

export default function DashboardBackground() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        let W, H, animId, particles

        const COLORS = [
            "rgba(100,116,139,",
            "rgba(148,163,184,",
            "rgba(203,213,225,",
            "rgba(56,189,248,",
        ]

        function makeParticle(initial = false) {
            return {
                x:      Math.random() * W,
                y:      initial ? Math.random() * H : H + 6,
                r:      Math.random() * 2.2 + 0.8,
                alpha:  Math.random() * 0.55 + 0.25,
                vx:     (Math.random() - 0.5) * 0.22,
                vy:     -(Math.random() * 0.36 + 0.12),
                color:  COLORS[Math.floor(Math.random() * COLORS.length)],
                pulse:  Math.random() * Math.PI * 2,
                pspeed: Math.random() * 0.012 + 0.006,
            }
        }

        function resize() {
            W = canvas.width  = window.innerWidth
            H = canvas.height = window.innerHeight
        }

        function init() {
            resize()
            particles = Array.from({ length: 55 }, () => makeParticle(true))
        }

        function drawLines() {
            const MAX = 100
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i], b = particles[j]
                    const dx = a.x - b.x, dy = a.y - b.y
                    const d  = Math.sqrt(dx * dx + dy * dy)
                    if (d < MAX) {
                        ctx.beginPath()
                        ctx.moveTo(a.x, a.y)
                        ctx.lineTo(b.x, b.y)
                        ctx.strokeStyle = `rgba(100,116,139,${(1 - d / MAX) * 0.2})`
                        ctx.lineWidth = 0.8
                        ctx.stroke()
                    }
                }
            }
        }

        function loop() {
            ctx.clearRect(0, 0, W, H)
            drawLines()
            particles.forEach(p => {
                p.x += p.vx
                p.y += p.vy
                p.pulse += p.pspeed
                if (p.y < -6) Object.assign(p, makeParticle(false))

                const a = p.alpha + Math.sin(p.pulse) * 0.12
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fillStyle = p.color + Math.max(0, Math.min(1, a)) + ")"
                ctx.fill()
            })
            animId = requestAnimationFrame(loop)
        }

        init()
        loop()

        window.addEventListener("resize", resize)
        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener("resize", resize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 0,
            }}
        />
    )
}
