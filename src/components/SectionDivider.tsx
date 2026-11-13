import React from 'react'

// Pembatas tipis antar-section: garis memudar + dua kotak kecil warna brand
export const SectionDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-paper-300" />
    <span className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rotate-45 bg-brand-600" />
      <span className="w-1.5 h-1.5 rotate-45 bg-accent-500" />
    </span>
    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-paper-300" />
  </div>
)
