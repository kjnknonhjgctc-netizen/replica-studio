// @ts-nocheck -- ported as-is from the original project
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@/delux/router';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { AssistantConversation, AssistantMessage } from '../../types';
import { AssistantOrb } from '../../components/assistant/AssistantOrb';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { 
  Sparkles, 
  Send, 
  Plus, 
  ArrowLeft,
  MessageSquare, 
  History, 
  PanelLeftClose, 
  PanelLeft, 
  Target, 
  Zap, 
  Calendar, 
  Flame, 
  ChevronRight, 
  Clock, 
  Copy, 
  Check, 
  Mic, 
  MicOff, 
  Trash2, 
  Search, 
  RotateCcw,
  Compass,
  CheckCircle2,
  ListOrdered,
  X
} from 'lucide-react';

type AssistantMode = 'estrategia' | 'foco' | 'habitos' | 'clareza';

interface PromptCard {
  title: string;
  desc: string;
  prompt: string;
  icon: React.ReactNode;
  tag: string;
}

const MODES: { id: AssistantMode; label: string; icon: any; desc: string }[] = [
  { id: 'estrategia', label: 'Estratégia & Metas', icon: Target, desc: 'Planejamento de marcos e visão' },
  { id: 'foco', label: 'Foco Diário', icon: Zap, desc: 'Prioridades e tarefas de hoje' },
  { id: 'habitos', label: 'Hábitos & Ritmo', icon: Flame, desc: 'Consistência sem sobrecarga' },
  { id: 'clareza', label: 'Clareza & Decisão', icon: Compass, desc: 'Destrinchar bloqueios' },
];

const PROMPT_CARDS_BY_MODE: Record<AssistantMode, PromptCard[]> = {
  estrategia: [
    {
      title: 'Estruturar meu grande objetivo',
      desc: 'Quebre sua meta principal em marcos mensuráveis de 30, 60 e 90 dias.',
      prompt: 'Ajude-me a estruturar meu objetivo principal em metas semanais com etapas práticas e marcos claros.',
      icon: <Target className="w-4 h-4 text-[#2563EB]" />,
      tag: 'Estratégia'
    },
    {
      title: 'Reorganizar meu cronograma semanal',
      desc: 'Encontre o equilíbrio entre trabalho profundo, descanso e hábitos diários.',
      prompt: 'Preciso reorganizar meu cronograma desta semana para conciliar hábitos e metas sem me sobrecarregar.',
      icon: <Calendar className="w-4 h-4 text-[#4E56FF]" />,
      tag: 'Planejamento'
    },
    {
      title: 'Definir métricas de progresso',
      desc: 'Como saber com precisão se estou avançando na direção certa a cada semana.',
      prompt: 'Quais são os melhores indicadores e métricas semanais para acompanhar o progresso dos meus objetivos?',
      icon: <Sparkles className="w-4 h-4 text-[#7033FF]" />,
      tag: 'Métricas'
    },
    {
      title: 'Eliminar gargalos e distrações',
      desc: 'Mapeie o que mais consome sua energia e estabeleça barreiras inteligentes.',
      prompt: 'Como identificar e eliminar os 2 maiores gargalos que estão atrasando o avanço dos meus projetos?',
      icon: <Flame className="w-4 h-4 text-[#E65100]" />,
      tag: 'Otimização'
    }
  ],
  foco: [
    {
      title: 'O que devo priorizar hoje?',
      desc: 'Identifique tarefas de alto impacto para focar seu tempo com máxima eficiência.',
      prompt: 'Com base no meu dia, quais são as 3 principais prioridades que devo focar hoje para avançar de verdade?',
      icon: <Zap className="w-4 h-4 text-[#7033FF]" />,
      tag: 'Foco Imediato'
    },
    {
      title: 'Bloco de 25 minutos de alta intensidade',
      desc: 'Defina exatamente o que fazer no próximo bloco Pomodoro sem dispersão.',
      prompt: 'Vou começar um bloco de foco de 25 minutos agora. Como devo estruturar esse tempo para terminar uma tarefa?',
      icon: <Target className="w-4 h-4 text-[#2563EB]" />,
      tag: 'Execução'
    },
    {
      title: 'Vencer a procrastinação inicial',
      desc: 'Técnica dos 5 minutos para romper a inércia e entrar no estado de fluxo.',
      prompt: 'Estou adiando uma tarefa importante agora. Me dê uma estratégia prática de 2 minutos para começar sem hesitar.',
      icon: <Flame className="w-4 h-4 text-[#E65100]" />,
      tag: 'Anti-Inércia'
    },
    {
      title: 'Checklist de encerramento do dia',
      desc: 'Feche o expediente com a sensação de dever cumprido e o dia seguinte planejado.',
      prompt: 'Gere um checklist rápido de 4 etapas para encerrar meu dia produtivo e deixar o próximo organizado.',
      icon: <CheckCircle2 className="w-4 h-4 text-[#10B981]" />,
      tag: 'Rotina'
    }
  ],
  habitos: [
    {
      title: 'Como manter a consistência diária?',
      desc: 'Estratégias científicas para não quebrar a cadeia de hábitos.',
      prompt: 'Estou com dificuldade de manter a consistência. Quais técnicas práticas posso aplicar hoje para não falhar?',
      icon: <Flame className="w-4 h-4 text-[#E65100]" />,
      tag: 'Disciplina'
    },
    {
      title: 'Reduzir o atrito de começar',
      desc: 'Torne o hábito tão pequeno e simples que seja impossível falhar.',
      prompt: 'Como posso aplicar a regra dos 2 minutos para facilitar a realização dos meus hábitos matinais?',
      icon: <Zap className="w-4 h-4 text-[#7033FF]" />,
      tag: 'Micro-Hábitos'
    },
    {
      title: 'O que fazer quando eu falhar um dia?',
      desc: 'A regra de nunca falhar duas vezes consecutivas na prática.',
      prompt: 'Ontem não consegui cumprir minhas metas de hábitos. Como me recuperar hoje sem culpa e sem tentar compensar o dobro?',
      icon: <RotateCcw className="w-4 h-4 text-[#2563EB]" />,
      tag: 'Recuperação'
    },
    {
      title: 'Empilhar novos hábitos na rotina',
      desc: 'Conecte um novo hábito a um comportamento automático existente.',
      prompt: 'Me ensine a usar a técnica de empilhamento de hábitos (habit stacking) para criar uma rotina noturna consistente.',
      icon: <ListOrdered className="w-4 h-4 text-[#4E56FF]" />,
      tag: 'Estruturação'
    }
  ],
  clareza: [
    {
      title: 'Mapear decisões difíceis',
      desc: 'Avalie prós, contras e impacto de segundo nível com neutralidade.',
      prompt: 'Preciso tomar uma decisão importante sobre meus projetos. Me guie com perguntas estratégicas para clarear minha mente.',
      icon: <Compass className="w-4 h-4 text-[#2563EB]" />,
      tag: 'Decisão'
    },
    {
      title: 'Descarrego mental (Brain Dump)',
      desc: 'Transforme pensamentos dispersos em ações claras e organizadas.',
      prompt: 'Minha cabeça está cheia de pendências soltas. Como posso organizar esse turbilhão em uma lista executável?',
      icon: <Sparkles className="w-4 h-4 text-[#7033FF]" />,
      tag: 'Organização'
    },
    {
      title: 'Regra de Pareto 80/20',
      desc: 'Identifique os 20% das suas ações que geram 80% do resultado real.',
      prompt: 'Como posso aplicar o Princípio de Pareto para cortar tarefas inúteis da minha rotina esta semana?',
      icon: <Target className="w-4 h-4 text-[#4E56FF]" />,
      tag: 'Filtro'
    },
    {
      title: 'Diagnóstico de sobrecarga',
      desc: 'Entenda se o problema é excesso de compromissos ou falta de clareza.',
      prompt: 'Sinto que estou sempre ocupado mas não vejo o progresso. Como fazer um diagnóstico rápido do meu uso de tempo?',
      icon: <Calendar className="w-4 h-4 text-[#E65100]" />,
      tag: 'Diagnóstico'
    }
  ]
};

const QUICK_FOLLOW_UPS = [
  'Detalhe em passos práticos',
  'Como criar esse hábito?',
  'Resuma em tópicos executáveis',
  'Adapte para minha rotina diária',
  'Me dê um exemplo prático'
];

export const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<AssistantMode>('estrategia');

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Speech recognition (Voice input)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadConversations();

    // Check speech recognition support
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (e: any) => {
        setIsListening(false);
        if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) {
          setSpeechError('Permissão de microfone negada no navegador.');
        } else if (e && e.error !== 'no-speech') {
          setSpeechError('Não foi possível captar o áudio. Tente novamente.');
        }
        setTimeout(() => setSpeechError(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Auto-resize textarea according to content on mobile & desktop
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      const list = Array.isArray(res?.conversations) ? res.conversations.filter(Boolean) : [];
      setConversations(list);

      if (list.length === 0) {
        // An empty result only clears the visible thread; it does not delete anything in storage.
        setCurrentConvId(null);
        setMessages([]);
        return;
      }

      const selected = list.find(c => c.id === currentConvId) || list[0];
      const msgRes = await api.getMessages(selected.id);
      setCurrentConvId(selected.id);
      setMessages(Array.isArray(msgRes?.messages) ? msgRes.messages.filter(Boolean) : []);
    } catch (err) {
      console.error('Não foi possível carregar o histórico do assistente:', err);
      setHistoryError('Não foi possível carregar o histórico. Tente novamente.');
    }
  };

  const handleSelectConversation = async (convId: string) => {
    stopSpeaking();
    setHistoryError(null);
    try {
      // Only switch the selected thread after its messages have loaded successfully.
      const msgRes = await api.getMessages(convId);
      setCurrentConvId(convId);
      setMessages(Array.isArray(msgRes?.messages) ? msgRes.messages.filter(Boolean) : []);
      if (window.innerWidth < 768) setShowHistory(false);
    } catch (err) {
      console.error('Não foi possível abrir a conversa:', err);
      setHistoryError('Não foi possível abrir esta conversa. Sua conversa atual foi mantida.');
    }
  };

  const handleNewConversation = () => {
    stopSpeaking();
    // On mobile, close history drawer automatically
    if (window.innerWidth < 768) {
      setShowHistory(false);
    }
    setCurrentConvId(null);
    setMessages([]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (currentConvId === convId) {
        handleNewConversation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle speech-to-text dictation
  const handleToggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      try {
        setSpeechError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  };

  // Audio playback is disabled.
  const stopSpeaking = () => {};

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(msgId);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    stopSpeaking();
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }

    const optimisticUserMsg: AssistantMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: currentConvId || '',
      user_id: '',
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticUserMsg]);
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

    try {
      const res = await api.sendChatMessage(text.trim(), currentConvId || undefined);
      if (!currentConvId && res?.conversation) {
        setCurrentConvId(res.conversation.id);
        setConversations(prev => [res.conversation, ...prev]);
      }
      setMessages(prev => [
        ...prev.filter(m => m.id !== optimisticUserMsg.id),
        res?.userMessage,
        res?.assistantMessage
      ].filter(Boolean));
      if (res.action?.type === 'navigate' && typeof res.action.path === 'string') {
        window.setTimeout(() => navigate(res.action.path), 650);
      }
    } catch (err: any) {
      const errorMsg: AssistantMessage = {
        id: `err_${Date.now()}`,
        conversation_id: currentConvId || '',
        user_id: '',
        role: 'assistant',
        content: err?.message || 'Não foi possível obter a resposta do assistente.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev.filter(m => m.id !== optimisticUserMsg.id), errorMsg]);
      setInputMessage(text);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(c =>
    (c.title || 'Conversa').toLowerCase().includes(historySearch.toLowerCase())
  );

  // Formats assistant markdown-like text with cards and lists
  const renderFormattedAssistantContent = (content: string) => {
    const lines = String(content ?? '').split('\n');

    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200 break-words">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          // Headers: ### Title or **Title**
          if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
            const headingText = trimmed.replace(/^#+\s*/, '');
            return (
              <h4 key={idx} className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm pt-1 tracking-tight flex items-center gap-1.5 sm:gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4E56FF] shrink-0" />
                <span className="break-words">{headingText}</span>
              </h4>
            );
          }

          // Numbered items: 1. Item
          const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numberedMatch) {
            const num = numberedMatch[1];
            const itemText = numberedMatch[2];
            return (
              <div key={idx} className="flex items-start gap-2 sm:gap-2.5 my-1 pl-0.5 sm:pl-1">
                <span className="shrink-0 w-5 h-5 rounded-md bg-gradient-to-r from-[#7033FF]/15 to-[#2563EB]/15 text-[#4E56FF] dark:text-[#889BFF] text-[11px] font-bold flex items-center justify-center mt-0.5 border border-[#4E56FF]/30">
                  {num}
                </span>
                <span className="flex-1 break-words">
                  {renderInlineFormatting(itemText)}
                </span>
              </div>
            );
          }

          // Bullet items: - or *
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.replace(/^[-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 sm:gap-2.5 my-1 pl-0.5 sm:pl-1">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#60A5FA] mt-1.5 sm:mt-2" />
                <span className="flex-1 break-words">
                  {renderInlineFormatting(itemText)}
                </span>
              </div>
            );
          }

          // Regular paragraph
          return (
            <p key={idx} className="break-words">
              {renderInlineFormatting(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  const renderInlineFormatting = (text: string) => {
    // Replace **bold** with strong
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex h-full w-full min-h-0 bg-[#FAFAFC] dark:bg-[#0B0E14] text-[#0F172A] dark:text-[#F1F5F9] overflow-hidden select-text relative transition-colors">
      {/* Mobile Backdrop Overlay for History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowHistory(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Responsive History Drawer: Slide-over Drawer on Mobile, Inline Collapsible on Desktop */}
      <AnimatePresence initial={false}>
        {showHistory && (
          <motion.aside
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed md:static inset-y-0 left-0 z-50 md:z-20 w-[84vw] max-w-[320px] md:w-[280px] lg:w-[300px] h-full border-r border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F141E] flex flex-col shrink-0 overflow-hidden shadow-2xl md:shadow-none transition-colors"
          >
            {/* History Header */}
            <div className="p-3.5 sm:p-4 border-b border-[#F1F5F9] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0F141E] shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#4E56FF]" />
                <span className="text-xs font-bold text-[#0F172A] dark:text-white tracking-tight">Histórico de Sessões</span>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1.5 text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Fechar histórico"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* New Conversation CTA */}
            <div className="p-3 border-b border-[#F8FAFC] shrink-0">
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNewConversation}
                className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#7033FF] via-[#4E56FF] to-[#2563EB] hover:from-[#6228F0] hover:to-[#1D54D8] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-[#4E56FF]/25 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Nova conversa</span>
              </motion.button>

              {/* History Search */}
              <div className="relative mt-2.5">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#4E56FF] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {historyError && (
                <div role="alert" className="mx-2 mb-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                  {historyError}
                  <button type="button" onClick={() => { setHistoryError(null); loadConversations(); }} className="ml-2 font-semibold underline">Tentar novamente</button>
                </div>
              )}
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  {historySearch ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa gravada ainda.'}
                </div>
              ) : (
                filteredConversations.map(c => {
                  const isActive = currentConvId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      className={`group relative w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/40 border border-[#C7D2FE] dark:border-blue-800/60 text-[#1E1B4B] dark:text-blue-200 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? 'text-[#4E56FF]' : 'text-slate-400 dark:text-slate-500'}`} />
                      <div className="flex-1 truncate pr-6">
                        <span className="block truncate">{c.title || 'Conversa'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-normal mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(c.updated_at || c.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {/* Delete conversation button */}
                      <button
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all absolute right-2 top-2.5 cursor-pointer"
                        title="Excluir conversa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Workstation - Occupies All Available Space */}
      <div className="flex-1 min-h-0 flex flex-col h-full min-w-0 bg-transparent dark:bg-[#0B0E14] overflow-hidden relative z-10">
        {/* Top Header Bar with Glassmorphic Apple Touch */}
        <header className="h-12 sm:h-14 border-b border-slate-200 dark:border-neutral-800 px-2 sm:px-4 lg:px-6 flex items-center justify-between shrink-0 bg-white/95 dark:bg-[#0B0E14] backdrop-blur-xl z-20 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {/* Back Button to Início */}
            <button
              onClick={() => navigate('/app/inicio')}
              aria-label="Voltar para a página inicial"
              title="Voltar para o Início"
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-2xs shrink-0 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#4E56FF]" />
              <span className="hidden sm:inline">Início</span>
            </button>

            {/* Toggle History Sidebar Button */}
            <button
              onClick={() => setShowHistory(prev => !prev)}
              aria-label={showHistory ? 'Ocultar histórico' : 'Ver histórico'}
              title={showHistory ? 'Ocultar histórico' : 'Ver histórico'}
              className={`p-2 sm:px-2.5 sm:py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0 active:scale-95 ${
                showHistory
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-[#C7D2FE] dark:border-blue-800/60 text-[#4E56FF] dark:text-[#889BFF]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs'
              }`}
            >
              {showHistory ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Histórico</span>
            </button>


          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* New conversation button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNewConversation}
              className="p-2 sm:px-3.5 sm:py-1.5 text-xs font-semibold text-[#4E56FF] dark:text-[#889BFF] hover:bg-[#EEF2FF] dark:hover:bg-slate-800 border border-[#C7D2FE] dark:border-slate-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 bg-white dark:bg-slate-800"
              title="Nova conversa"
            >
              <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Nova conversa</span>
            </motion.button>
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center max-w-2xl w-full mx-auto text-center py-6 sm:py-10">
              <div className="mb-4">
                <AssistantOrb size="lg" isSpeaking={false} isGenerating={loading} />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
                Oi! Como posso te ajudar?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mb-7">
                Vamos transformar o que você tem em mente em um próximo passo simples.
              </p>
              <div className="w-full max-w-lg flex flex-col gap-2 text-left">
                <button
                  type="button"
                  onClick={() => handleSendMessage('Me ajude a definir os próximos passos do meu principal objetivo.')}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111622] px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  <Target className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-[#4E56FF]" />
                  <span className="flex-1">Organizar meu objetivo</span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('Me ajude a escolher minhas prioridades de hoje.')}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111622] px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  <Zap className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-[#4E56FF]" />
                  <span className="flex-1">Escolher minhas prioridades</span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('Me ajude a criar um hábito simples que eu consiga manter.')}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111622] px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  <Flame className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-[#4E56FF]" />
                  <span className="flex-1">Criar um hábito possível</span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================
               ACTIVE CONVERSATION THREAD - FULL RESPONSIVE STREAM
               ======================================================== */
            <div className="w-full max-w-4xl xl:max-w-5xl mx-auto space-y-4 sm:space-y-5">
              {messages.map(msg => {
                const isUser = msg.role === 'user';
                const isCopied = copiedMessageId === msg.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Assistant Message Avatar */}
                    {!isUser && (
                      <div className="shrink-0 mt-1">
                        <AssistantOrb
                          size="sm"
                          isSpeaking={false}
                          isGenerating={false}
                          isWaving={msg.id === messages[messages.length - 1]?.id}
                        />
                      </div>
                    )}

                    <div
                      className={`relative group max-w-[88%] sm:max-w-[82%] rounded-2xl ${
                        isUser
                          ? 'px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-[#7033FF] via-[#4E56FF] to-[#2563EB] text-white shadow-md shadow-[#4E56FF]/20 rounded-tr-xs text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words'
                          : 'p-3.5 sm:p-5 bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-neutral-800 shadow-2xs rounded-tl-xs break-words'
                      }`}
                    >
                      {/* Message Content */}
                      {isUser ? (
                        msg.content
                      ) : (
                        renderFormattedAssistantContent(msg.content)
                      )}

                      {/* Interactive Actions Strip on Assistant Messages */}
                      {!isUser && (
                        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Copiar mensagem"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-semibold text-[11px]">Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="text-[11px]">Copiar</span>
                                </>
                              )}
                            </button>


                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Generating / Loading indicator */}
              {loading && (
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="shrink-0 mt-1">
                    <AssistantOrb
                      size="sm"
                      isSpeaking={false}
                      isGenerating={true}
                    />
                  </div>
                  <div
                    role="status"
                    aria-label="Assistente respondendo"
                    className="px-4 py-3 bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs flex items-center justify-center shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      <span className="w-1.5 h-1.5 bg-[#4E56FF] rounded-full animate-bounce [animation-delay:0s]" />
                      <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 bg-[#7033FF] rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ========================================================
            FIXED CHAT COMPOSER AT BOTTOM - APPLE STUDIO AESTHETIC
           ======================================================== */}
        <div className="p-2.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0E14] shrink-0 z-30 transition-colors">
          <div className="w-full max-w-4xl xl:max-w-5xl mx-auto space-y-2">
            {/* Listening indicator banner */}
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex items-center justify-between px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 animate-pulse"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
                  <span className="font-semibold text-[11px] sm:text-xs">Ouvindo sua voz... Fale agora</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className="text-[11px] font-bold text-rose-800 dark:text-rose-300 hover:underline cursor-pointer px-1 py-0.5"
                >
                  Concluir
                </button>
              </motion.div>
            )}

            {/* Speech error banner */}
            {speechError && (
              <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>{speechError}</span>
                <button onClick={() => setSpeechError(null)} className="text-amber-900 dark:text-amber-200 font-bold ml-2 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Follow-up Chips when Conversation is Active */}
            {messages.length > 0 && !loading && (
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar text-xs touch-pan-x">
                {QUICK_FOLLOW_UPS.slice(0, 2).map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    className="shrink-0 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-[#EEF2FF] dark:hover:bg-slate-700 hover:text-[#4E56FF] dark:hover:text-[#889BFF] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs font-medium transition-colors cursor-pointer shadow-2xs active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input Composer Box */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 focus-within:border-[#4E56FF] rounded-2xl transition-colors"
            >
              {/* Voice dictation microphone button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 mb-0.5 active:scale-95 ${
                    isListening
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 ring-2 ring-rose-300 animate-pulse'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title={isListening ? 'Parar gravação de voz' : 'Falar com o assistente (Ditado)'}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Text Area Input with auto-expanding height */}
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  isListening
                    ? 'Ouvindo sua voz... fale agora...'
                    : 'Pergunte qualquer coisa ao assistente...'
                }
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoCapitalize="sentences"
                autoCorrect="on"
                spellCheck={true}
                enterKeyHint="send"
                className="w-full py-2 px-1.5 sm:px-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent resize-none focus:outline-none max-h-28 leading-relaxed self-center"
              />

              {/* Send Button with gradient purple to blue */}
              <motion.button
                type="submit"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                disabled={!inputMessage.trim() || loading}
                aria-label="Enviar mensagem"
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-[#7033FF] via-[#4E56FF] to-[#2563EB] hover:from-[#6228F0] hover:to-[#1D54D8] text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-md shadow-[#4E56FF]/25 font-semibold text-xs mb-0.5 active:scale-95"
              >
                <span className="hidden sm:inline">Enviar</span>
                <Send className="w-3.5 h-3.5 stroke-[2.4]" />
              </motion.button>
            </form>

            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
              <span>Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Enter ↵</kbd> para enviar • <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Shift+Enter</kbd> quebra linha</span>
              <span className="font-medium">Assistente Executivo Delux</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
