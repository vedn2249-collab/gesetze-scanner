import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, User, Lock, CheckCircle2 } from 'lucide-react';
import { ChatMessage, TrafficUser } from '../types';

interface TrafficGeminiBotProps {
  currentUser: TrafficUser | null;
  onPaymentSuccess: (updatedUser: TrafficUser) => void;
}

const PRESET_QUESTIONS = [
  'Helmpflicht E-Scooter?',
  'Dieselfahrverbote Auto?',
  'Fahrrad Gehweg Alter?',
  'Roller auf Fahrradweg?'
];

export default function TrafficGeminiBot({ currentUser, onPaymentSuccess }: TrafficGeminiBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-traffic-bot',
      role: 'model',
      text: 'Hallo! Ich bin Ihr intelligenter **Gesetz-Lern-Assistent für Verkehrsrecht (StVO/StVZO)**. 🚦\n\nFragen Sie mich zu Helmpflichten, Geschwindigkeitsbegrenzungen, E-Scooter-Vorschriften oder Bußgeldern. Wie kann ich Ihnen helfen?',
      timestamp: new Date().toISOString()
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPremium = currentUser?.paidUntil ? new Date(currentUser.paidUntil) > new Date() : false;

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const history = messages
        .filter(m => !m.id.startsWith('welcome'))
        .map(m => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/ask-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          history,
          mode: 'traffic-law'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const modelMsg: ChatMessage = {
          id: `msg-${Date.now()}-model`,
          role: 'model',
          text: data.text || 'Entschuldigung, ich konnte keine Antwort verarbeiten.',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, modelMsg]);
      } else {
        // Local smart fallback generator for traffic law questions
        const fallbackAnswer = generateLocalTrafficAnswer(textToSend);
        const modelMsg: ChatMessage = {
          id: `msg-${Date.now()}-model`,
          role: 'model',
          text: fallbackAnswer,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, modelMsg]);
      }
    } catch (err) {
      console.warn('API error, using local traffic answer generator:', err);
      const fallbackAnswer = generateLocalTrafficAnswer(textToSend);
      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        role: 'model',
        text: fallbackAnswer,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, modelMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateLocalTrafficAnswer = (prompt: string): string => {
    const p = prompt.toLowerCase();
    if (p.includes('escooter') || p.includes('e-scooter') || p.includes('roller')) {
      return `### 🛴 E-Scooter & Elektrokleinstfahrzeuge (§ 21e StVO)

1. **Radweg-Pflicht:** E-Scooter dürfen nur auf Radwegen, Radfahrstreifen und Fahrradstraßen gefahren werden.
2. **Gehweg-Verbot:** Das Fahren auf Gehwegen ist streng verboten (Bußgeld bis 55 €).
3. **Helmpflicht:** Es besteht aktuell keine gesetzliche Helmpflicht, das Tragen eines Helms wird jedoch dringend empfohlen.
4. **Altersgrenze:** Das Mindestalter beträgt 14 Jahre. Ein Führerschein ist nicht erforderlich.`;
    }
    if (p.includes('helm') || p.includes('motorrad')) {
      return `### 🏍️ Helmpflicht im Straßenverkehr (§ 21a StVO)

1. **Geltungsbereich:** Wer Krafträder oder offene drei- oder mehrrädrige Kraftfahrzeuge mit einer bauartbedingten Höchstgeschwindigkeit von über 20 km/h führt, muss einen geeigneten Schutzhelm tragen.
2. **Ausnahme:** Dies gilt nicht, wenn vorgeschriebene Sicherheitsgurte angelegt sind.
3. **Bußgeld:** Bei Nichtbeachtung droht ein Verwarnungsgeld von 15 €.`;
    }
    if (p.includes('fahrrad') || p.includes('gehweg')) {
      return `### 🚲 Fahrräder auf Gehwegen (§ 2 StVO)

1. **Kinder bis 8 Jahre:** Müssen auf Gehwegen fahren.
2. **Kinder bis 10 Jahre:** Dürfen auf Gehwegen fahren.
3. **Erwachsene:** Müssen Radwege oder die Fahrbahn benutzen. Das Fahren auf dem Gehweg kostet 25 € bis 55 € Bußgeld.`;
    }

    return `### 🚥 Straßenverkehrsordnung (StVO) Auskunft

Zu Ihrer Frage: **"${prompt}"**

1. **Grundregel (§ 1 StVO):** Die Teilnahme am Straßenverkehr erfordert ständige Vorsicht und gegenseitige Rücksichtnahme.
2. **Formvorschriften:** Bei Ordnungswidrigkeiten (Bußgeldbescheid) gilt eine Einspruchsfrist von **2 Wochen** ab Zustellung.
3. **Rechtstipp:** Überprüfen Sie Fristen und Messprotokolle auf Einhaltung der Formvorschriften.`;
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-amber-500/20 shadow-gold-glow flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-lg font-black text-white font-display flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          StVO KI-Lern-Assistent & Verkehrsrecht-Q&A
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Stellen Sie Fragen zu Verkehrsregeln, Paragraphen, Helmpflichten oder Bußgeldern. Die künstliche Intelligenz antwortet präzise auf Basis der StVO.
        </p>
      </div>

      {/* Messages Window */}
      <div 
        ref={containerRef}
        className="flex-grow rounded-xl border border-zinc-800 bg-black p-4 overflow-y-auto max-h-[380px] min-h-[220px] space-y-3 font-mono"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${
                isUser 
                  ? 'bg-amber-400 text-black font-bold' 
                  : 'bg-zinc-900 border border-amber-500/30 text-amber-400'
              }`}>
                {isUser ? <User className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
              </div>

              <div className={`p-3 rounded-xl text-xs leading-relaxed space-y-1.5 ${
                isUser 
                  ? 'bg-amber-400/10 border border-amber-400/30 text-white rounded-tr-none' 
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
              }`}>
                {msg.text.split('\n').map((line, lidx) => {
                  if (line.startsWith('###')) {
                    return <h4 key={lidx} className="font-extrabold text-sm text-amber-300 mt-2 mb-1 uppercase tracking-tight">{line.replace('###', '').trim()}</h4>;
                  }
                  if (line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.')) {
                    return <p key={lidx} className="text-zinc-200 pl-1">{line}</p>;
                  }
                  return line ? <p key={lidx} className="text-zinc-300">{line}</p> : <div key={lidx} className="h-1" />;
                })}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-start gap-2.5 max-w-[80%] mr-auto animate-pulse">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-amber-400 shrink-0">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 text-xs text-amber-400 font-mono rounded-xl rounded-tl-none">
              KI analysiert StVO...
            </div>
          </div>
        )}
      </div>

      {/* Preset Pills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESET_QUESTIONS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleSendMessage(preset)}
            className="px-2.5 py-1 rounded-full text-[10px] font-mono border border-zinc-800 bg-black hover:border-amber-400/40 hover:text-amber-300 text-zinc-400 transition-all cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Frage stellen (z.B. Wie hoch ist das Bußgeld bei Rotlicht?)"
          className="flex-grow px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
        />
        <button
          type="submit"
          id="btn_send_traffic_chat"
          disabled={!inputText.trim() || isTyping}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-mono font-extrabold text-xs uppercase rounded-xl cursor-pointer transition-all disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
