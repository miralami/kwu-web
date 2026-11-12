import React from 'react'

// Panci dengan asap mengepul, tutup yang terangkat-angkat, dan badan panci yang bergetar
// seperti sedang mendidih. Untuk status "Sedang dimasak".
// Saat pengguna memilih "kurangi animasi", gambar tetap tampil tapi diam.
export const CookingPotAnimated: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Asap: tiga gumpalan naik bergantian */}
    <g strokeWidth={1.8}>
      <path d="M7.5 8c-1-1.1 1-2.2 0-3.5" className="motion-safe:animate-steam" />
      <path d="M12 7.5c-1-1.1 1-2.2 0-3.7" className="motion-safe:animate-steam [animation-delay:0.45s]" />
      <path d="M16.5 8c-1-1.1 1-2.2 0-3.5" className="motion-safe:animate-steam [animation-delay:0.9s]" />
    </g>

    {/* Panci bergetar seperti mendidih */}
    <g className="motion-safe:animate-boil">
      {/* Tutup terangkat-angkat karena uap */}
      <g className="motion-safe:animate-lid [transform-box:fill-box] [transform-origin:center_bottom]">
        <path d="M10.8 9.3h2.4" />
        <path d="M4 11.3h16" />
      </g>
      {/* Badan panci + gagang */}
      <path d="M5 11.3v5.7a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5.7" />
      <path d="M5 13.5H2.8M19 13.5h2.2" />
    </g>
  </svg>
)
