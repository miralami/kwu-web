import React, { useState } from 'react'
import { X, Send, Key } from 'lucide-react'
import { ChatbotMascot } from './ChatbotMascot'
import { TypingIndicator } from './TypingIndicator'
import { ADMIN_CONTACT } from '../../data/menu'

interface Message {
  sender: 'bot' | 'user'
  text: string
}

const FAQ_KNOWLEDGE: Record<string, string> = {
  cibay:
    'Cibay (Aci Ngambay) adalah camilan khas Sunda berbahan aci gurih berbumbu ayam dan daun bawang, dibungkus kulit lumpia lalu digoreng garing saat dipesan. Dilengkapi bumbu cabai pedas! Dijual per porsi: 1 porsi isi 3 pcs Rp10.000.',
  ramyeon:
    'Spicy Ramyeon Roll adalah mie ramyeon Korea pedas gurih yang digulung dengan Rice Paper kenyal transparan khas jajanan viral TikTok. Harganya Rp5.000 isi 2 pcs.',
  puding:
    'Puding Karamel & Buah Dingin adalah dessert cup 240 ml yang lembut dengan saus karamel dan potongan buah segar, penyejuk rasa pedas. Harganya Rp15.000 per cup.',
  qris:
    'Saat checkout, kamu mendapatkan tampilan Qris dengan batas bayar 15 menit. Simpan gambar Qris, scan via m-Banking/e-Wallet, lalu klik tombol konfirmasi WhatsApp ya!',
  lokasi: `Lokasi pengambilan pesanan di ${ADMIN_CONTACT.pickupPoint}. Bisa juga titip di kelas jika kamu sebutkan di catatan pemesanan.`,
  pedas:
    'Level pedas berada di kisaran sedang-ke-pedas (level 2-3). Jika tidak tahan pedas, tulis di catatan "Bumbu cabai dipisah/sedikit".',
  combo:
    'Paket Combo Juara berisi 1 porsi Cibay (isi 3) + 2 Spicy Ramyeon Roll seharga Rp14.000 (hemat Rp1.000 dari normal Rp15.000).',
  perkenalan:
    'Aku Lami, asisten virtual Laris Manis! Namaku dari Laris Manis. Aku bisa bantu kasih rekomendasi menu, info harga, lokasi ambil, dan cara bayar Qris.',
  rekomendasi:
    'Baru pertama coba? Ambil Paket Combo Juara (1 porsi Cibay isi 3 + 2 Spicy Ramyeon Roll) cuma Rp14.000, hemat Rp1.000 dan bisa cicip dua menu gurih sekaligus. Kurang tahan pedas? Tambah Puding Karamel & Buah Dingin 240 ml (Rp15.000) buat penyegar. Mau ngemil hemat sendiri? Spicy Ramyeon Roll Rp5.000 isi 2 paling pas.',
}

const REKOMENDASI_KEYWORDS = ['rekomen', 'best', 'laris', 'favorit', 'bingung', 'paling enak', 'pilih apa', 'saran']
const PERKENALAN_KEYWORDS = ['lami', 'siapa kamu', 'kamu siapa', 'nama kamu', 'namamu']

export const AiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Halo, aku Lami! 👋 Mau tanya menu pre-order, rekomendasi menu, lokasi ambil, atau cara bayar Qris?',
    },
  ])
  const [input, setInput] = useState('')
  const [openRouterKey, setOpenRouterKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input
    if (!textToSend.trim()) return

    const newMsgs: Message[] = [...messages, { sender: 'user', text: textToSend }]
    setMessages(newMsgs)
    setInput('')
    setIsLoading(true)

    if (openRouterKey.trim()) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.2-3b-instruct:free',
            messages: [
              {
                role: 'system',
                content:
                  'Kamu adalah Lami (singkatan LAris MAnis), asisten virtual yang ramah ala anak kuliahan untuk Laris Manis KWU Telkom University. Jual Cibay (1 porsi isi 3 pcs Rp10rb), Spicy Ramyeon Roll (isi 2 pcs Rp5rb), Puding Karamel & Buah 240 ml (Rp15rb), Paket Combo Juara 1 porsi Cibay + 2 Roll Rp14rb (hemat Rp1rb). Kalau pembeli bingung atau minta rekomendasi, sarankan Paket Combo Juara untuk pembeli baru dan Puding Karamel sebagai penyegar setelah makan pedas. Jawab singkat, ramah, dan solutif.',
              },
              ...newMsgs.map((m) => ({
                role: m.sender === 'bot' ? 'assistant' : 'user',
                content: m.text,
              })),
            ],
          }),
        })

        const data = await response.json()
        const botReply = data.choices?.[0]?.message?.content
        if (botReply) {
          setMessages((prev) => [...prev, { sender: 'bot', text: botReply }])
          setIsLoading(false)
          return
        }
      } catch (e) {
        console.warn('OpenRouter request failed, fallback to local KB:', e)
      }
    }

    setTimeout(() => {
      const lower = textToSend.toLowerCase()
      let reply =
        'Pertanyaan kamu bisa langsung ditanyakan ke admin via WhatsApp atau silakan pilih menu di atas ya.'

      // Perkenalan & rekomendasi dicek lebih dulu: "Laris Manis" mengandung "manis" yang memicu jawaban puding
      if (PERKENALAN_KEYWORDS.some((kw) => lower.includes(kw))) {
        reply = FAQ_KNOWLEDGE.perkenalan
      } else if (REKOMENDASI_KEYWORDS.some((kw) => lower.includes(kw))) {
        reply = FAQ_KNOWLEDGE.rekomendasi
      } else if (lower.includes('cibay') || lower.includes('aci')) {
        reply = FAQ_KNOWLEDGE.cibay
      } else if (lower.includes('ramyeon') || lower.includes('roll') || lower.includes('korea')) {
        reply = FAQ_KNOWLEDGE.ramyeon
      } else if (lower.includes('puding') || lower.includes('karamel') || lower.includes('manis')) {
        reply = FAQ_KNOWLEDGE.puding
      } else if (lower.includes('qris') || lower.includes('bayar') || lower.includes('transfer')) {
        reply = FAQ_KNOWLEDGE.qris
      } else if (lower.includes('lokasi') || lower.includes('ambil') || lower.includes('dimana')) {
        reply = FAQ_KNOWLEDGE.lokasi
      } else if (lower.includes('pedas') || lower.includes('cabe') || lower.includes('level')) {
        reply = FAQ_KNOWLEDGE.pedas
      } else if (lower.includes('combo') || lower.includes('hemat') || lower.includes('paket')) {
        reply = FAQ_KNOWLEDGE.combo
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: reply }])
      setIsLoading(false)
    }, 900) // jeda agar animasi mengetik sempat terlihat
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 sm:bottom-5 right-5 z-30 min-h-[44px] bg-ink-900 text-surface pl-1.5 pr-3 py-1.5 rounded-full shadow-lg hover:bg-ink-800 transition-all flex items-center gap-2 border border-ink-800"
          title="Tanya Lami, asisten virtual Laris Manis"
          aria-label="Tanya Lami, asisten virtual Laris Manis"
        >
          <ChatbotMascot className="w-9 h-9" />
          <span className="text-xs font-bold">Tanya Lami</span>
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Lami, asisten virtual Laris Manis"
          className="fixed bottom-20 sm:bottom-5 right-5 z-40 w-full max-w-[340px] sm:max-w-sm bg-surface rounded-xl shadow-2xl border border-paper-200 overflow-hidden flex flex-col h-[480px]"
        >
          <div className="bg-inverse text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChatbotMascot className="w-9 h-9" />
              <div>
                <h3 className="font-extrabold text-sm leading-tight">Lami</h3>
                <p className="text-xs text-stone-300">Asisten Laris Manis</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-300 hover:text-white rounded"
                title="Input OpenRouter API Key (Opsional)"
                aria-label="Input API Key"
              >
                <Key className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-300 hover:text-white rounded"
                aria-label="Tutup Chatbot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showKeyInput && (
            <div className="p-2 bg-paper-100 border-b border-paper-200 text-xs space-y-1">
              <label className="text-xs font-bold text-ink-600">OpenRouter API Key (Opsional):</label>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                className="w-full text-xs p-1.5 border border-paper-200 rounded bg-surface"
              />
            </div>
          )}

          <div
            className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-paper-50 text-xs"
            aria-live="polite"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface text-ink-900 border border-paper-200 shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && <TypingIndicator />}
          </div>

          <div className="p-2 bg-surface border-t border-paper-100 flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              'Rekomendasi?',
              'Apa itu Cibay?',
              'Spicy Ramyeon Roll?',
              'Puding Karamel?',
              'Cara bayar Qris?',
              'Lokasi Ambil?',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                className="min-h-[44px] text-xs font-bold bg-paper-100 hover:bg-paper-200 text-ink-800 px-3 py-1.5 rounded whitespace-nowrap border border-paper-200 flex items-center"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="p-2.5 bg-surface border-t border-paper-200 flex gap-1.5">
            <input
              type="text"
              placeholder="Ketik pertanyaan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 min-h-[44px] text-xs px-3 border border-paper-200 rounded-lg bg-paper-50"
            />
            <button
              onClick={() => handleSend()}
              className="min-h-[44px] min-w-[44px] px-3 bg-ink-900 text-surface rounded-lg hover:bg-ink-800 flex items-center justify-center"
              aria-label="Kirim pertanyaan"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
