export async function extractDominantColor(
  imageUrl: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const SIZE = 64 // downsample for performance
      canvas.width = SIZE
      canvas.height = SIZE

      const ctx = canvas.getContext("2d")
      if (!ctx) return resolve(null)

      ctx.drawImage(img, 0, 0, SIZE, SIZE)
      const data = ctx.getImageData(0, 0, SIZE, SIZE).data

      let bestH = 0,
        bestS = 0,
        bestL = 0

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255
        const g = data[i + 1] / 255
        const b = data[i + 2] / 255

        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const l = (max + min) / 2
        const d = max - min
        const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))

        let h = 0
        if (d !== 0) {
          if (max === r) h = ((g - b) / d + 6) % 6
          else if (max === g) h = (b - r) / d + 2
          else h = (r - g) / d + 4
          h *= 60
        }

        // Pick vivid colors only: high saturation, mid lightness
        if (s > bestS && s > 0.4 && l > 0.2 && l < 0.8) {
          bestH = h
          bestS = s
          bestL = l
        }
      }

      if (bestS < 0.4) return resolve(null) // image too muted

      // Boost the extracted color to be accent-worthy
      const hex = hslToHex(
        bestH,
        Math.min(bestS * 1.2, 1),
        Math.min(bestL * 1.1, 0.65),
      )
      resolve(hex)
    }

    img.onerror = () => resolve(null)
    img.src = imageUrl
  })
}

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0")
  }
  return `#${f(0)}${f(8)}${f(4)}`
}
