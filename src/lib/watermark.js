import sharp from "sharp"

function buildTextWatermark(width, height, text) {
    const fontSize = Math.max(18, Math.floor(Math.min(width, height) * 0.045))
    const opacity = 0.55
    const spacing = Math.floor(fontSize * 6)
    const cols = Math.ceil(width / spacing) + 2
    const rows = Math.ceil(height / spacing) + 2

    let texts = ""
    for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
            const x = c * spacing + (r % 2 === 0 ? 0 : spacing / 2)
            const y = r * spacing
            texts += `
                <text
                    x="${x}"
                    y="${y}"
                    font-family="Arial, sans-serif"
                    font-size="${fontSize}"
                    font-weight="bold"
                    fill="white"
                    fill-opacity="${opacity}"
                    stroke="black"
                    stroke-width="0.8"
                    stroke-opacity="${opacity * 0.4}"
                    transform="rotate(-30, ${x}, ${y})"
                    letter-spacing="2"
                >
                    ${text}
                </text>
            `
        }
    }

    return Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            ${texts}
        </svg>
    `)
}

async function buildLogoWatermark(width, height, logoBuffer) {
    const logoSize = Math.min(120, Math.floor(Math.min(width, height) * 0.12))
    const opacity = 0.50
    const spacingX = Math.floor(logoSize * 2.8)
    const spacingY = Math.floor(logoSize * 2.8)
    const cols = Math.ceil(width / spacingX) + 2
    const rows = Math.ceil(height / spacingY) + 2

    // Redimensionar logo una sola vez
    const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer()

    const logoMeta = await sharp(resizedLogo).metadata()
    const logoW = logoMeta.width
    const logoH = logoMeta.height
    const logoBase64 = resizedLogo.toString("base64")

    // Mosaico de logos igual que el texto
    let images = ""
    for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
            const x = c * spacingX + (r % 2 === 0 ? 0 : spacingX / 2)
            const y = r * spacingY
            images += `
                <image
                    href="data:image/png;base64,${logoBase64}"
                    x="${x}"
                    y="${y}"
                    width="${logoW}"
                    height="${logoH}"
                    opacity="${opacity}"
                    transform="rotate(-30, ${x + logoW / 2}, ${y + logoH / 2})"
                />
            `
        }
    }

    return Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            ${images}
        </svg>
    `)
}

export async function processProtectedImage(imageBuffer, watermarkConfig = {}) {
    const {
        type = "text",
        text = "PhotoBook",
        logoUrl = null,
    } = watermarkConfig

    const maxDimension = 900

    // 1. Resize primero
    const resized = await sharp(imageBuffer)
        .resize(maxDimension, maxDimension, {
            fit: "inside",
            withoutEnlargement: true,
        })
        .jpeg({ quality: 42, progressive: true })
        .toBuffer()

    // 2. Dimensiones reales post-resize
    const { width, height } = await sharp(resized).metadata()

    // 3. Construir marca de agua según tipo
    let watermarkSvg

    if (type === "logo" && logoUrl) {
        try {
            const logoRes = await fetch(logoUrl)
            if (!logoRes.ok) throw new Error("Logo no disponible")
            const logoBuffer = Buffer.from(await logoRes.arrayBuffer())
            watermarkSvg = await buildLogoWatermark(width, height, logoBuffer)
        } catch (err) {
            console.warn("Error cargando logo, usando texto como fallback:", err.message)
            watermarkSvg = buildTextWatermark(width, height, text || "PhotoBook")
        }
    } else {
        watermarkSvg = buildTextWatermark(width, height, text || "PhotoBook")
    }

    // 4. Composite
    const processed = await sharp(resized)
        .composite([{
            input: watermarkSvg,
            top: 0,
            left: 0,
            blend: "over",
        }])
        .jpeg({ quality: 42 })
        .toBuffer()

    return processed
}