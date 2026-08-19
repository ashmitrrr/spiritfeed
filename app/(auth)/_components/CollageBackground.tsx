// Full-bleed pixel-animal collage behind the auth screens (login / join /
// setup), with a semi-opaque olive wash so it reads as texture, not competing
// content — the auth card floats on top as the focal point (Canva sign-in
// layout). Curated from public/animals_bg/, excluding the watermarked donkey
// (小红书 stamp) and the very low-res Octopus.jpeg per Ashmit.
const COLLAGE_IMAGES = [
  "13651605115636532.jpeg",
  "1618549865016094.jpeg",
  "18507048539021667.jpeg",
  "1900024839234160.jpeg",
  "196047390025053787.jpeg",
  "21181060743550798.jpeg",
  "29625310047627133.jpeg",
  "3799980931092979.jpeg",
  "472385448438467642.jpeg",
  "5840674511652771.jpeg",
  "7107311908311142.jpeg",
  "8233211829462518.jpeg",
  "875105771339491409.jpeg",
  "NFT.jpeg",
  "PIXEL-162 DOLPHIN.jpeg",
  "Tears of the Otter Pixel.jpeg",
  "осьминог пиксель арт.jpeg",
]

// Repeat the set so the grid fills large viewports without obvious gaps.
const TILES = [...COLLAGE_IMAGES, ...COLLAGE_IMAGES, ...COLLAGE_IMAGES]

export function CollageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-olive">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
        {TILES.map((name, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${name}-${i}`}
            src={`/animals_bg/${encodeURIComponent(name)}`}
            alt=""
            aria-hidden
            className="aspect-square w-full object-cover"
          />
        ))}
      </div>
      {/* Semi-opaque olive wash over the collage. */}
      <div className="absolute inset-0 bg-olive/80" />
    </div>
  )
}
