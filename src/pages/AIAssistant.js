import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Send, Bot, User, Loader2, Trash2, Sparkles, Mic, MicOff, Volume2, VolumeX, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_QUESTIONS_AR = [
  'ما أفضل تمارين لخسارة الوزن؟',
  'كيف أحسن نومي؟',
  'ما الأكل الصحي لليوم؟',
  'كيف أزيد خطواتي اليومية؟',
  'كم سعرة يجب أن آكل؟',
  'ما تمارين القلب الأفضل؟',
];
const QUICK_QUESTIONS_EN = [
  'Best exercises for weight loss?',
  'How to improve my sleep?',
  'What to eat healthy today?',
  'How to increase my daily steps?',
  'How many calories should I eat?',
  'Best cardio exercises?',
];

export default function AIAssistant({ profile }) {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: lang === 'ar'
        ? '👋 مرحباً! أنا مساعدك الصحي الذكي. اسألني أي شيء عن صحتك أو تغذيتك أو تمارينك — وأستطيع أن أتكلم معك بصوت مباشر! 🎙️'
        : "👋 Hello! I'm your AI health assistant. Ask me anything about health, nutrition, or fitness — I can also speak directly to you! 🎙️"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speakText = (text, idx) => {
    if (!window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setSpeakingIdx(null);
      return;
    }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    utt.rate = 0.92;
    utt.pitch = 1.05;
    utt.onend = () => { setSpeaking(false); setSpeakingIdx(null); };
    utt.onerror = () => { setSpeaking(false); setSpeakingIdx(null); };
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
    setSpeakingIdx(idx);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const txt = e.results[0][0].transcript;
      setInput(txt);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    const context = lang === 'ar'
      ? `أنت مساعد صحي ذكي محادثاتي. المستخدم: عمره ${profile?.age} سنة، وزنه ${profile?.weight_kg} كيلو، طوله ${profile?.height_cm} سم، هدفه ${profile?.goal}. السؤال: "${q}". أجب بالعربية بشكل مباشر وعملي ومحفز، 3-5 جمل فقط. استخدم إيموجي.`
      : `You are a conversational AI health coach. User: ${profile?.age}y, ${profile?.weight_kg}kg, ${profile?.height_cm}cm, goal: ${profile?.goal}. Question: "${q}". Answer directly, practically, motivationally in 3-5 sentences. Use emojis.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt: context });
    setMessages(prev => [...prev, { role: 'assistant', text: res }]);
    setLoading(false);

    // Auto-speak last AI response
    setTimeout(() => {
      const newIdx = messages.length + 1;
      speakText(res, newIdx);
    }, 300);
  };

  const quickQs = lang === 'ar' ? QUICK_QUESTIONS_AR : QUICK_QUESTIONS_EN;
  const initMsg = messages[0]?.text;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/20 via-primary/10 to-background px-4 pt-12 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center border border-accent/30">
                <Bot className="w-6 h-6 text-accent" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
            </div>
            <div>
              <h1 className="text-base font-black">{lang === 'ar' ? '🤖 المساعد الصحي الذكي' : '🤖 AI Health Coach'}</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <p className="text-[10px] text-green-400 font-semibold">
                  {lang === 'ar' ? 'نشط — يتكلم بالصوت' : 'Active — Speaks aloud'}
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => { window.speechSynthesis?.cancel(); setMessages([{ role: 'assistant', text: initMsg }]); setSpeaking(false); }}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">{lang === 'ar' ? '💡 اقتراحات سريعة:' : '💡 Quick questions:'}</p>
            <div className="grid grid-cols-2 gap-2">
              {quickQs.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="bg-muted rounded-2xl p-3 text-xs text-start text-foreground/80 hover:bg-primary/10 hover:text-primary transition-all border border-border hover:border-primary/30 font-medium">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === 'assistant' ? 'bg-gradient-to-br from-accent/30 to-primary/20' : 'bg-primary/20'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-accent" /> : <User className="w-4 h-4 text-primary" />}
              </div>
              <div className={`max-w-[80%] group relative`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-card border border-border text-foreground rounded-tl-sm'
                    : 'bg-primary text-primary-foreground rounded-tr-sm'
                }`}>
                  {msg.text}
                </div>
                {/* Speak button for assistant messages */}
                {msg.role === 'assistant' && window.speechSynthesis && (
                  <button
                    onClick={() => speakText(msg.text, i)}
                    className={`mt-1 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full transition-all ${
                      speakingIdx === i ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    {speakingIdx === i ? (
                      <><StopCircle className="w-3 h-3" /> {lang === 'ar' ? 'إيقاف' : 'Stop'}</>
                    ) : (
                      <><Volume2 className="w-3 h-3" /> {lang === 'ar' ? 'استمع' : 'Listen'}</>
                    )}
                    {/* Sound wave animation */}
                    {speakingIdx === i && (
                      <span className="flex gap-0.5 items-end h-3">
                        {[2,4,3,5,3].map((h, j) => (
                          <motion.span key={j} className="w-0.5 bg-primary rounded-full"
                            animate={{ height: [`${h}px`, `${h*2}px`, `${h}px`] }}
                            transition={{ delay: j*0.1, repeat: Infinity, duration: 0.5 }} />
                        ))}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex gap-1.5 items-end">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-2 h-2 bg-accent/60 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.6 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="px-4 pb-6 pt-3 border-t border-border bg-card/50 backdrop-blur-sm">
        {listening && (
          <div className="flex items-center justify-center gap-2 mb-2 text-red-400 text-xs font-semibold">
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}
              className="w-2 h-2 bg-red-400 rounded-full" />
            {lang === 'ar' ? 'جارٍ الاستماع...' : 'Listening...'}
          </div>
        )}
        <div className="flex gap-2">
          {/* Mic button */}
          <button
            onClick={listening ? stopListening : startListening}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
              listening ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {listening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-muted-foreground" />}
          </button>

          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={lang === 'ar' ? '💬 اكتب أو تكلم...' : '💬 Type or speak...'}
            className="flex-1 bg-muted rounded-2xl px-4 py-3 text-sm outline-none border border-border focus:border-primary/50 transition-all"
          />

          <button onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center disabled:opacity-40 transition-all hover:bg-primary/90 shadow-lg shadow-primary/30 flex-shrink-0">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary-foreground" /> : <Send className="w-5 h-5 text-primary-foreground" />}
          </button>
        </div>
      </div>
    </div>
  );
}
