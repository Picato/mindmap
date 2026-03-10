export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function exportSVG(svgElement: SVGSVGElement, filename: string) {
  const serializer = new XMLSerializer()
  const svgStr = serializer.serializeToString(svgElement)
  const blob = new Blob([svgStr], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(filename)}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPNG(svgElement: SVGSVGElement, filename: string) {
  const serializer = new XMLSerializer()
  const svgStr = serializer.serializeToString(svgElement)
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = 2
      const width = svgElement.clientWidth || 1200
      const height = svgElement.clientHeight || 800
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.fillStyle = '#030712' // gray-950
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Canvas export failed')); return }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${slugify(filename)}.png`
        a.click()
        URL.revokeObjectURL(url)
        resolve()
      }, 'image/png')
    }
    img.onerror = reject
    img.src = url
  })
}
