import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type CSSProperties } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, CirclePlus, Clock3, Flame, Goal, LayoutDashboard, ListChecks, Settings2, Sparkles, Trophy, Trash2, WandSparkles } from "lucide-react";
import "@/delux2.css";

type Task = { id: string; title: string; goal: string; date: string; minutes: number; done: boolean };
type GoalItem = { id: string; title: string; why: string; mode: "auto" | "manual"; createdAt: string };
type Prefs = { days: number[]; minutes: number; start: string; pace: string };
const KEY = "delux-2.0-state";
const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const todayISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const plusDays = (iso: string, n: number) => { const d = new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return todayISO(d); };
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const defaultPrefs: Prefs = { days: [1,2,3,4,5], minutes: 30, start: "18:00", pace: "Equilibrado" };
const seed = () => ({ goals: [] as GoalItem[], tasks: [] as Task[], prefs: defaultPrefs });
function makeTasks(goal: GoalItem, prefs: Prefs, start = todayISO()): Task[] {
  const title = goal.title.trim();
  const steps = goal.mode === "manual" ? [`Definir o primeiro passo de: ${title}`] : [
    `Pesquisar o básico de ${title}`, `Praticar ${title} por ${prefs.minutes} minutos`,
    `Revisar o que aprendi em ${title}`, `Avançar para a próxima etapa de ${title}`,
    `Praticar e registrar meu progresso em ${title}`, `Revisar resultados de ${title}`
  ];
  const available = prefs.days.length ? prefs.days : [1,2,3,4,5];
  const tasks: Task[] = [];
  let cursor = start;
  steps.forEach((step, i) => {
    let tries = 0;
    while (!available.includes(new Date(cursor+"T12:00:00").getDay()) && tries < 8) { cursor = plusDays(cursor, 1); tries++; }
    tasks.push({ id: newId(), title: step, goal: goal.id, date: cursor, minutes: prefs.minutes, done: false });
    cursor = plusDays(cursor, i === 0 ? 1 : (i % 2 === 0 ? 1 : 2));
  });
  return tasks;
}
function App() {
  const [page, setPage] = useState("Início");
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [loaded, setLoaded] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalWhy, setGoalWhy] = useState("");
  const [mode, setMode] = useState<"auto"|"manual">("auto");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState(todayISO());
  const [taskGoal, setTaskGoal] = useState("");
  const [weekStart, setWeekStart] = useState(todayISO());
  const [editingPrefs, setEditingPrefs] = useState(defaultPrefs);
  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) { const data = JSON.parse(raw); setGoals(data.goals ?? []); setTasks(data.tasks ?? []); setPrefs(data.prefs ?? defaultPrefs); setEditingPrefs(data.prefs ?? defaultPrefs); } } catch { /* start with clean local state */ } setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify({ goals, tasks, prefs })); }, [goals, tasks, prefs, loaded]);
  const today = todayISO();
  const completed = tasks.filter(t=>t.done).length;
  const progress = tasks.length ? Math.round(completed/tasks.length*100) : 0;
  const todayTasks = tasks.filter(t=>t.date===today);
  const activeGoals = goals.length;
  const greeting = new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"numeric",month:"long"}).format(new Date());
  const week = useMemo(()=>Array.from({length:7},(_,i)=>plusDays(weekStart,i)),[weekStart]);
  function addGoal(e: FormEvent) {
    e.preventDefault(); if (!goalTitle.trim()) return;
    const goal: GoalItem = { id:newId(), title:goalTitle.trim(), why:goalWhy.trim(), mode, createdAt:today };
    setGoals(prev=>[goal,...prev]);
    if (mode==="auto") setTasks(prev=>[...prev,...makeTasks(goal,prefs)]);
    setGoalTitle(""); setGoalWhy("");
  }
  function addTask(e: React.FormEvent) {
    e.preventDefault(); if (!taskTitle.trim()) return;
    setTasks(prev=>[...prev,{id:newId(),title:taskTitle.trim(),goal:taskGoal,date:taskDate,minutes:prefs.minutes,done:false}]);
    setTaskTitle("");
  }
  function toggleTask(id:string) { setTasks(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t)); }
  function deleteGoal(id:string) { setGoals(prev=>prev.filter(g=>g.id!==id)); setTasks(prev=>prev.filter(t=>t.goal!==id)); }
  const nav = [
    {name:"Início",icon:LayoutDashboard},{name:"Metas",icon:Goal},{name:"Calendário",icon:CalendarDays},{name:"Preferências",icon:Settings2}
  ];
  const tasksFor = (date:string) => tasks.filter(t=>t.date===date);
  return <div className="d2-shell">
    <aside className="d2-sidebar">
      <div className="d2-brand"><div className="d2-logo">d.</div><div><strong>delux</strong><span>SEU PRÓXIMO NÍVEL</span></div></div>
      <div className="d2-nav-label">ESPAÇO DE TRABALHO</div>
      <nav>{nav.map(item=><button key={item.name} className={page===item.name?"d2-nav active":"d2-nav"} onClick={()=>setPage(item.name)}><item.icon size={19}/><span>{item.name}</span>{page===item.name&&<span className="d2-nav-dot"/>}</button>)}</nav>
      <div className="d2-sidebar-bottom"><div className="d2-streak"><div className="d2-streak-icon"><Flame size={19}/></div><div><b>{completed} passos concluídos</b><span>Pequeno progresso, todo dia.</span></div></div><div className="d2-profile"><div className="d2-avatar">D</div><div><b>Meu espaço</b><span>Plano pessoal</span></div><Settings2 size={17}/></div></div>
    </aside>
    <main className="d2-main">
      <header className="d2-topbar"><div className="d2-mobile-brand"><span className="d2-logo">d.</span> delux</div><div className="d2-breadcrumb">Meu espaço <span>/</span> <b>{page}</b></div><div className="d2-top-right"><span className="d2-date">{greeting}</span><div className="d2-mini-avatar">D</div></div></header>
      <div className="d2-content">
      {page==="Início"&&<><div className="d2-welcome"><div><div className="d2-eyebrow">SEU ESPAÇO, SEU RITMO</div><h1>Um passo de cada vez<span>.</span></h1><p>Você não precisa fazer tudo hoje. Só precisa continuar.</p></div><button className="d2-primary" onClick={()=>setPage("Metas")}><CirclePlus size={18}/> Nova meta</button></div>
        <section className="d2-hero"><div className="d2-hero-copy"><div className="d2-pill"><Sparkles size={14}/> SEU PROGRESSO</div><h2>O futuro que você quer<br/>começa no que faz <em>hoje.</em></h2><p>Transforme intenção em pequenas ações que cabem na sua rotina.</p><button className="d2-hero-button" onClick={()=>setPage("Metas")}>Continuar evoluindo <ChevronRight size={17}/></button></div><div className="d2-progress-visual"><div className="d2-progress-ring" style={{"--progress":progress+"%"} as CSSProperties}><div><strong>{progress}%</strong><span>concluído</span></div></div><div className="d2-progress-caption"><Trophy size={16}/> Cada passo conta</div></div><div className="d2-hero-orb orb-one"/><div className="d2-hero-orb orb-two"/></section>
        <div className="d2-section-heading"><div><h2>Seu panorama</h2><p>Pequenas vitórias constroem grandes mudanças.</p></div></div>
        <div className="d2-stats"><div className="d2-stat"><div className="d2-stat-icon purple"><Goal size={19}/></div><span>Metas ativas</span><strong>{activeGoals}</strong><small>objetivos em andamento</small></div><div className="d2-stat"><div className="d2-stat-icon green"><ListChecks size={19}/></div><span>Passos concluídos</span><strong>{completed}</strong><small>um avanço de cada vez</small></div><div className="d2-stat"><div className="d2-stat-icon orange"><Flame size={19}/></div><span>Para hoje</span><strong>{todayTasks.filter(t=>!t.done).length}</strong><small>tarefas esperando por você</small></div></div>
        <div className="d2-home-grid"><section className="d2-panel"><div className="d2-panel-head"><div><h3>Plano de hoje</h3><p>Seu próximo passo está aqui.</p></div><button className="d2-text-button" onClick={()=>setPage("Calendário")}>Ver calendário <ChevronRight size={15}/></button></div>{todayTasks.length?todayTasks.map(t=><TaskRow key={t.id} task={t} onToggle={toggleTask}/>):<div className="d2-empty"><div className="d2-empty-icon"><CalendarDays size={22}/></div><b>Um dia aberto para começar</b><p>Crie uma meta e seu plano aparece aqui.</p><button className="d2-secondary" onClick={()=>setPage("Metas")}>Criar minha primeira meta</button></div>}</section>
        <section className="d2-panel"><div className="d2-panel-head"><div><h3>Suas metas</h3><p>O que você está construindo.</p></div><button className="d2-icon-button" onClick={()=>setPage("Metas")} aria-label="Ver metas"><ChevronRight size={18}/></button></div>{goals.length?goals.slice(0,4).map(g=><div className="d2-goal-mini" key={g.id}><div className="d2-goal-mini-icon"><Goal size={17}/></div><div><b>{g.title}</b><span>{tasks.filter(t=>t.goal===g.id&&t.done).length} passos concluídos</span></div><ChevronRight size={16}/></div>):<div className="d2-empty d2-empty-small"><p>Ainda não há metas. Escolha algo que gostaria de aprender ou conquistar.</p><button className="d2-secondary" onClick={()=>setPage("Metas")}>Explorar metas</button></div>}</section></div>
      </>}
      {page==="Metas"&&<><div className="d2-page-intro"><div className="d2-eyebrow">INTENÇÃO VIRA AÇÃO</div><h1>Suas metas<span>.</span></h1><p>Escolha onde quer chegar. Organize o caminho do seu jeito.</p></div><div className="d2-goal-layout"><section className="d2-panel d2-create-panel"><div className="d2-panel-head"><div><h3>Comece algo novo</h3><p>Você escolhe como transformar a meta em ação.</p></div><div className="d2-panel-spark"><WandSparkles size={20}/></div></div><form onSubmit={addGoal} className="d2-form"><label>Qual é a sua meta?</label><input value={goalTitle} onChange={e=>setGoalTitle(e.target.value)} placeholder="Ex.: aprender violão, ler mais..." required maxLength={100}/><label>Por que isso é importante para você? <span>Opcional</span></label><textarea value={goalWhy} onChange={e=>setGoalWhy(e.target.value)} placeholder="Escreva o que te motiva..." rows={2} maxLength={250}/><label>Como quer começar?</label><div className="d2-mode-options"><button type="button" onClick={()=>setMode("auto")} className={mode==="auto"?"d2-mode selected":"d2-mode"}><div className="d2-mode-icon auto"><WandSparkles size={19}/></div><div><b>Plano automático</b><span>Organize etapas nos seus dias disponíveis.</span></div><span className="d2-radio">{mode==="auto"&&<i/>}</span></button><button type="button" onClick={()=>setMode("manual")} className={mode==="manual"?"d2-mode selected":"d2-mode"}><div className="d2-mode-icon manual"><ListChecks size={19}/></div><div><b>Montar manualmente</b><span>Crie sua meta e adicione tarefas à mão.</span></div><span className="d2-radio">{mode==="manual"&&<i/>}</span></button></div><button className="d2-primary d2-submit" type="submit"><CirclePlus size={18}/> Criar meta</button></form></section><section className="d2-goals-list"><div className="d2-section-heading"><div><h2>Em andamento</h2><p>{goals.length} {goals.length===1?"meta criada":"metas criadas"}</p></div></div>{goals.length?goals.map(g=>{const related=tasks.filter(t=>t.goal===g.id);const done=related.filter(t=>t.done).length;return <article className="d2-goal-card" key={g.id}><div className="d2-goal-card-top"><div className="d2-goal-mini-icon"><Goal size={19}/></div><span className="d2-status">{g.mode==="auto"?"Plano automático":"Plano manual"}</span><button className="d2-delete" onClick={()=>deleteGoal(g.id)} aria-label="Excluir meta"><Trash2 size={16}/></button></div><h3>{g.title}</h3>{g.why&&<p>{g.why}</p>}<div className="d2-goal-progress-line"><span style={{width:(related.length?done/related.length*100:0)+"%"}}/></div><div className="d2-goal-card-foot"><span>{done} de {related.length} passos</span><button className="d2-text-button" onClick={()=>{setTaskGoal(g.id);setPage("Calendário")}}>Ver tarefas <ChevronRight size={15}/></button></div>{g.mode==="manual"&&<button className="d2-secondary d2-add-task" onClick={()=>{setTaskGoal(g.id);setPage("Calendário")}}>Adicionar tarefa</button>}</article>}):<div className="d2-panel d2-empty"><div className="d2-empty-icon"><Goal size={22}/></div><b>Suas próximas conquistas começam aqui</b><p>Crie uma meta usando o formulário ao lado.</p></div>}</section></div></>}
      {page==="Calendário"&&<><div className="d2-page-intro"><div className="d2-eyebrow">UM PLANO QUE CABE NA SUA VIDA</div><h1>Seu calendário<span>.</span></h1><p>Organize sua semana e avance sem perder o seu ritmo.</p></div><section className="d2-panel d2-calendar-panel"><div className="d2-calendar-toolbar"><div><h3>Sua semana</h3><p>As datas seguem o calendário local do seu dispositivo.</p></div><div className="d2-week-arrows"><button className="d2-icon-button" onClick={()=>setWeekStart(plusDays(weekStart,-7))} aria-label="Semana anterior"><ChevronLeft size={19}/></button><button className="d2-icon-button" onClick={()=>setWeekStart(plusDays(weekStart,7))} aria-label="Próxima semana"><ChevronRight size={19}/></button><button className="d2-secondary" onClick={()=>setWeekStart(today)}>Hoje</button></div></div><div className="d2-week-label">{new Intl.DateTimeFormat("pt-BR",{day:"numeric",month:"short"}).format(new Date(week[0]+"T12:00:00"))} — {new Intl.DateTimeFormat("pt-BR",{day:"numeric",month:"short",year:"numeric"}).format(new Date(week[6]+"T12:00:00"))}</div><div className="d2-week-grid">{week.map(date=>{const d=new Date(date+"T12:00:00");return <div className={date===today?"d2-day today":"d2-day"} key={date}><div className="d2-day-head"><span>{weekdays[d.getDay()]}</span><b>{d.getDate()}</b></div><div className="d2-day-tasks">{tasksFor(date).map(t=><button key={t.id} className={t.done?"d2-cal-task done":"d2-cal-task"} onClick={()=>toggleTask(t.id)} title={t.title}><span/>{t.title}</button>)}</div><button className="d2-add-day" onClick={()=>{setTaskDate(date);setTaskGoal("");document.getElementById("d2-add-task")?.scrollIntoView({behavior:"smooth",block:"center"});}}>+ tarefa</button></div>})}</div></section><section className="d2-panel d2-add-task-panel" id="d2-add-task"><div className="d2-panel-head"><div><h3>Adicionar tarefa</h3><p>Coloque uma ação na data que preferir.</p></div></div><form className="d2-task-form" onSubmit={addTask}><div className="d2-field-grow"><label>Nome da tarefa</label><input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="Ex.: praticar 20 minutos" required maxLength={120}/></div><div><label>Data</label><input type="date" value={taskDate} onChange={e=>setTaskDate(e.target.value)} required/></div><div><label>Vincular à meta</label><select value={taskGoal} onChange={e=>setTaskGoal(e.target.value)}><option value="">Tarefa avulsa</option>{goals.map(g=><option value={g.id} key={g.id}>{g.title}</option>)}</select></div><button type="submit" className="d2-primary"><CirclePlus size={17}/> Adicionar</button></form><div className="d2-all-tasks"><h3>Todas as tarefas</h3>{tasks.length?tasks.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(t=><TaskRow key={t.id} task={t} onToggle={toggleTask} />):<p className="d2-muted">Suas tarefas aparecerão aqui.</p>}</div></section></>}
      {page==="Preferências"&&<><div className="d2-page-intro"><div className="d2-eyebrow">SEU PLANO, SUAS REGRAS</div><h1>Preferências<span>.</span></h1><p>Planeje com a sua rotina real em mente.</p></div><section className="d2-panel d2-preferences"><div className="d2-panel-head"><div><h3>Disponibilidade semanal</h3><p>Os planos automáticos só usam os dias selecionados.</p></div><div className="d2-panel-spark"><Settings2 size={20}/></div></div><div className="d2-pref-block"><label>Em quais dias você pode se dedicar?</label><div className="d2-day-picker">{["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"].map((day,i)=><button key={day} onClick={()=>setEditingPrefs(p=>({...p,days:p.days.includes(i)?p.days.filter(d=>d!==i):[...p.days,i].sort((a,b)=>a-b)}))} className={editingPrefs.days.includes(i)?"d2-day-choice chosen":"d2-day-choice"}><span>{weekdays[i]}</span>{day}</button>)}</div>{editingPrefs.days.length===0&&<p className="d2-warning">Selecione pelo menos um dia para gerar planos automáticos.</p>}</div><div className="d2-pref-grid"><div className="d2-pref-block"><label>Tempo disponível por dia</label><p>Quanto tempo você consegue reservar?</p><div className="d2-minutes-options">{[15,30,45,60].map(n=><button key={n} className={editingPrefs.minutes===n?"d2-minute selected":"d2-minute"} onClick={()=>setEditingPrefs(p=>({...p,minutes:n}))}>{n} min</button>)}</div></div><div className="d2-pref-block"><label>Horário preferido</label><p>Um horário que funcione para você.</p><input type="time" value={editingPrefs.start} onChange={e=>setEditingPrefs(p=>({...p,start:e.target.value}))}/></div><div className="d2-pref-block"><label>Ritmo ideal</label><p>Como você quer distribuir seu esforço?</p><select value={editingPrefs.pace} onChange={e=>setEditingPrefs(p=>({...p,pace:e.target.value}))}><option>Leve</option><option>Equilibrado</option><option>Intenso</option></select></div></div><div className="d2-pref-note"><Sparkles size={18}/><p>Essas preferências são usadas na criação de novas metas. Alterá-las não muda tarefas que já estão no calendário.</p></div><div className="d2-pref-actions"><button className="d2-primary" onClick={()=>{if(!editingPrefs.days.length)return;setPrefs(editingPrefs);setPage("Início");}}>Salvar preferências</button><button className="d2-secondary" onClick={()=>{setEditingPrefs(prefs);}}>Descartar alterações</button></div></section></>}
      <footer className="d2-footer"><span className="d2-logo d2-logo-small">d.</span><span>Delux 2.0</span><span className="d2-footer-dot"/> Feito para evoluir no seu ritmo.</footer>
      </div>
    </main>
    <nav className="d2-mobile-nav">{nav.map(item=><button key={item.name} className={page===item.name?"active":""} onClick={()=>setPage(item.name)}><item.icon size={20}/><span>{item.name}</span></button>)}</nav>
  </div>;
}
function TaskRow({task,onToggle}:{task:Task;onToggle:(id:string)=>void}) {
  return <div className={task.done?"d2-task-row task-done":"d2-task-row"}><button className="d2-check" onClick={()=>onToggle(task.id)} aria-label={task.done?"Marcar como pendente":"Concluir tarefa"}>{task.done&&<Check size={15}/>}</button><div className="d2-task-copy"><b>{task.title}</b><span><Clock3 size={13}/> {task.minutes} min · {new Intl.DateTimeFormat("pt-BR",{day:"numeric",month:"short"}).format(new Date(task.date+"T12:00:00"))}</span></div><span className={task.done?"d2-task-tag done":"d2-task-tag"}>{task.done?"Concluída":"Pendente"}</span></div>;
}
export const Route = createFileRoute("/")({ component: App });
