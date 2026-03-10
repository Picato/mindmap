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

export async function exportPNG(svgElement: SVGSVGElement, filename: string, bgColor = '#ffffff') {
  const bbox = svgElement.getBoundingClientRect()
  const width = bbox.width || svgElement.clientWidth || 1200
  const height = bbox.height || svgElement.clientHeight || 800

  // Clone and set explicit dimensions so browsers render it correctly
  const clone = svgElement.cloneNode(true) as SVGSVGElement
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  const serializer = new XMLSerializer()
  const svgStr = serializer.serializeToString(clone)
  // encodeURIComponent data URL is more reliable than blob URL for SVG→canvas
  const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)

  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Canvas export failed')); return }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${slugify(filename)}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(a.href)
        resolve()
      }, 'image/png')
    }
    img.onerror = reject
    img.src = dataUrl
  })
}
