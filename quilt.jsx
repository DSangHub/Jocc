// Every club gets a quilt block. The same slug always produces the same block,
// so a club is recognisable by its patch before you read its name.

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Cell types: 0 ground · 1 solid A · 2 solid B · 3 half-square A on ground ·
// 4 half-square B on A. Only a quarter is generated; the rest is mirrored,
// which is what makes it read as a pieced block rather than noise.
export function quiltCells(seed) {
  const rand = mulberry32(hash(seed))
  const quadrant = []
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const r = rand()
      const onDiagonal = x === y
      const corner = x < 2 && y < 2
      let type
      if (onDiagonal) type = r < 0.55 ? 4 : 3
      else if (corner) type = r < 0.4 ? 1 : r < 0.7 ? 3 : 0
      else type = r < 0.3 ? 2 : r < 0.55 ? 3 : r < 0.75 ? 1 : 0
      quadrant.push({ type, rot: Math.floor(rand() * 4) })
    }
  }
  return quadrant
}

const TRI = '0,0 1,0 0,1'

function Cell({ cell, ground, a, b }) {
  const spin = `rotate(${cell.rot * 90} 0.5 0.5)`
  if (cell.type === 0) return <rect width="1" height="1" fill={ground} />
  if (cell.type === 1) return <rect width="1" height="1" fill={a} />
  if (cell.type === 2) return <rect width="1" height="1" fill={b} />
  if (cell.type === 3)
    return (
      <>
        <rect width="1" height="1" fill={ground} />
        <polygon points={TRI} fill={a} transform={spin} />
      </>
    )
  return (
    <>
      <rect width="1" height="1" fill={a} />
      <polygon points={TRI} fill={b} transform={spin} />
    </>
  )
}

export default function QuiltBlock({ seed, colors, size = 96, className = '' }) {
  const [ground, a, b] = colors
  const cells = quiltCells(seed)
  const placements = []

  for (let qy = 0; qy < 4; qy++) {
    for (let qx = 0; qx < 4; qx++) {
      const cell = cells[qy * 4 + qx]
      placements.push([`${qx}-${qy}-n`, `translate(${qx} ${qy})`, cell])
      placements.push([`${qx}-${qy}-x`, `translate(${8 - qx} ${qy}) scale(-1 1)`, cell])
      placements.push([`${qx}-${qy}-y`, `translate(${qx} ${8 - qy}) scale(1 -1)`, cell])
      placements.push([`${qx}-${qy}-xy`, `translate(${8 - qx} ${8 - qy}) scale(-1 -1)`, cell])
    }
  }

  return (
    <svg
      viewBox="0 0 8 8"
      width={size}
      height={size}
      className={className}
      role="presentation"
      shapeRendering="crispEdges"
    >
      {placements.map(([key, transform, cell]) => (
        <g key={key} transform={transform}>
          <Cell cell={cell} ground={ground} a={a} b={b} />
        </g>
      ))}
    </svg>
  )
}
