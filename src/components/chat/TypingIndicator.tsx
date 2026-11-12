import React from 'react'
import { ChatbotMascot } from './ChatbotMascot'

// Gelembung "sedang mengetik": maskot + animasi titik tiga dari GIF maskot (public/chatbot/typing.webp).
// Titiknya hitam, jadi di mode gelap dibalik warnanya (dark:invert) agar tetap terlihat.
export const TypingIndicator: React.FC = () => (
  <div className="flex items-end gap-2 justify-start motion-safe:animate-status-in" role="status">
    <ChatbotMascot className="w-7 h-7" />
    <div className="bg-surface border border-paper-200 shadow-sm rounded-lg px-3 py-2.5">
      <img
        src="/chatbot/typing.webp"
        alt=""
        width={96}
        height={31}
        className="h-3.5 w-auto opacity-80 dark:invert motion-reduce:hidden"
        draggable={false}
      />
      {/* Pengganti saat animasi dimatikan pengguna */}
      <span className="hidden motion-reduce:inline text-ink-500 font-semibold tracking-widest">•••</span>
      <span className="sr-only">Asisten sedang mengetik balasan</span>
    </div>
  </div>
)
