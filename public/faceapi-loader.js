// Colocar en: /public/faceapi-loader.js
// Script estático servido desde /public — Turbopack nunca lo procesa.

window.faceapiInit = async function () {
    await new Promise((resolve, reject) => {
        if (window.faceapi) return resolve()
        const s = document.createElement("script")
        s.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"
        s.onload = resolve
        s.onerror = reject
        document.head.appendChild(s)
    })

    const fa = window.faceapi

    await Promise.all([
        fa.nets.tinyFaceDetector.loadFromUri("/models"),
        fa.nets.faceLandmark68Net.loadFromUri("/models"),
        fa.nets.faceRecognitionNet.loadFromUri("/models"),
    ])

    return fa
}
