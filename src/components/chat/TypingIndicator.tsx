import React from 'react'
import { ChatbotMascot } from './ChatbotMascot'

// Gelembung "sedang mengetik": maskot + animasi titik tiga dari GIF maskot.
// Ada dua versi warna (titik gelap untuk mode terang, titik terang untuk mode gelap) yang
// dipilih lewat CSS biasa di index.css (.typing-dots-*), tanpa filter/`dark:` variant,
// agar tetap tampil di browser HP lama.
export const TypingIndicator: React.FC = () => (
  <div className="flex items-end gap-2 justify-start motion-safe:animate-status-in" role="status">
    <ChatbotMascot className="w-7 h-7" />
    <div className="bg-surface border border-paper-200 shadow-sm rounded-lg px-3 py-2.5 flex items-center">
      <img
        src="/chatbot/typing-light.webp"
        alt=""
        width={96}
        height={31}
        className="typing-dots typing-dots-light h-3.5 w-auto"
        draggable={false}
      />
      <img
        src="/chatbot/typing-dark.webp"
        alt=""
        width={96}
        height={31}
        className="typing-dots typing-dots-dark h-3.5 w-auto"
        draggable={false}
      />
      {/* Pengganti saat pengguna mematikan animasi */}
      <span className="typing-dots-static text-ink-500 font-semibold tracking-widest">•••</span>
      <span className="sr-only">Asisten sedang mengetik balasan</span>
    </div>
  </div>
)
