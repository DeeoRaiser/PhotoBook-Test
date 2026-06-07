const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE
const BUNNY_API_KEY = process.env.BUNNY_API_KEY
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL
const BUNNY_REGION = process.env.BUNNY_REGION || "storage.bunnycdn.com"

export async function uploadToBunny(fileBuffer, fileName, folder = "") {
    const path = folder ? `${folder}/${fileName}` : fileName
    const url = `https://${BUNNY_REGION}/${BUNNY_STORAGE_ZONE}/${path}`

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            AccessKey: BUNNY_API_KEY,
            "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
    })

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Bunny upload failed: ${response.status} - ${text}`)
    }

    return {
        bunnyPath: path,
        bunnyUrl: `${BUNNY_CDN_URL}/${path}`,
    }
}

export async function deleteFromBunny(bunnyPath) {
    const url = `https://${BUNNY_REGION}/${BUNNY_STORAGE_ZONE}/${bunnyPath}`

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            AccessKey: BUNNY_API_KEY,
        },
    })

    return response.ok
}

export function generateFileName(originalName) {
    const ext = originalName.split(".").pop().toLowerCase()
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}-${random}.${ext}`
}