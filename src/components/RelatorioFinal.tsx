import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download, Upload, Printer, ArrowLeft, CheckSquare, Square } from 'lucide-react';

/* ============================================================
   DADOS FIXOS
   ============================================================ */
const FIXED = {
  instrumento: "Termo de Colaboração nº 02/2026 - SEDS",
  processoSei: "202610319000985",
  administracao: "Secretaria de Estado de Desenvolvimento Social - SEDS",
  osc: "Fundação de Apoio ao Menor Inhumense - FAMI",
  objeto: "Execução emergencial das atividades indispensáveis à implantação e operação do CASER Rio Verde.",
  valorGlobal: "R$ 4.579.288,22",
  despesasPrevisto: {
    material: "308.839,85",
    servicos: "1.491.689,20",
    diarias: "8.499,60",
    vencimentos: "2.035.625,09",
    encargos: "734.634,48"
  }
};

const ANEXOS_LIST = [
  "Matriz de Indicadores preenchida e assinada",
  "Relatórios técnicos mensais e comprovantes de protocolo",
  "Evidências da implantação física, logística e tecnológica",
  "Relatórios extraídos do SGV e mapa de vagas, sem exposição indevida de dados pessoais",
  "Demonstrativos de PIA, escolarização, saúde, documentação civil e vínculos familiares",
  "Calendários, listas, certificados e relatórios de cultura, esporte, lazer, profissionalização e práticas restaurativas",
  "Relação de pessoal, escalas e certificados de formação continuada",
  "Síntese de ocorrências e providências, com documentos sensíveis em processo restrito quando necessário",
  "Demonstrativo financeiro sintético, extratos, balancetes, conciliação e comprovantes de devolução/provisão aplicáveis",
  "Relação de bens e situação patrimonial, quando houver"
];

const STEPS = [
  { id: "ident",        title: "Identificação da parceria" },
  { id: "resumo",       title: "Resumo executivo" },
  { id: "execucao",     title: "Execução do objeto" },
  { id: "publico",      title: "Público atendido" },
  { id: "resultados",   title: "Resultados e metas" },
  { id: "equipe",       title: "Equipe de trabalho" },
  { id: "ocorrencias",  title: "Ocorrências e riscos" },
  { id: "financeiro",   title: "Execução financeira" },
  { id: "dificuldades", title: "Dificuldades e desvios" },
  { id: "conclusao",    title: "Conclusão da OSC" },
  { id: "declaracao",   title: "Declaração e assinatura" },
  { id: "anexos",       title: "Índice de anexos" },
];

const initialState = {
  ident: { periodoIni: "", periodoFim: "", responsavel: "" },
  resumo: { texto: "" },
  execucao: {
    implantacao: "",
    entregas: [
      { nome: "Mobilização e mudança", prazo: "30 dias", situacao: "", evidencia: "", obs: "" },
      { nome: "Infraestrutura e TI", prazo: "30 dias", situacao: "", evidencia: "", obs: "" },
      { nome: "Suprimentos iniciais", prazo: "30 dias", situacao: "", evidencia: "", obs: "" },
      { nome: "Início da operação assistida", prazo: "30 dias", situacao: "", evidencia: "", obs: "" },
    ],
    manutencao: ""
  },
  publico: {
    meses: ["Mês 1","Mês 2","Mês 3","Mês 4","Mês 5","Mês 6"],
    linhas: [
      { label: "Ingressos", valores: ["","","","","",""], total: "" },
      { label: "Desligamentos/transferências", valores: ["","","","","",""], total: "" },
      { label: "Ocupação média", valores: ["","","","","",""], total: "" },
      { label: "Maior ocupação", valores: ["","","","","",""], total: "" },
      { label: "Internação definitiva", valores: ["","","","","",""], total: "" },
      { label: "Internação provisória", valores: ["","","","","",""], total: "" },
    ],
    analise: ""
  },
  resultados: {
    atingida:     { qtd: "", indic: "", just: "" },
    parcial:      { qtd: "", indic: "", just: "" },
    naoAtingida:  { qtd: "", indic: "", just: "" },
    naoAplicavel: { qtd: "", indic: "", just: "" },
    beneficios: "", impactos: "", satisfacao: "", sustentabilidade: ""
  },
  equipe: {
    linhas: [
      { cat: "Socioeducadores", previsto: "36", media: "", vac: "", medida: "" },
      { cat: "Equipe técnica psicossocial e pedagógica", previsto: "conforme Plano", media: "", vac: "", medida: "" },
      { cat: "Saúde", previsto: "conforme Plano", media: "", vac: "", medida: "" },
      { cat: "Coordenação e direção", previsto: "conforme Plano", media: "", vac: "", medida: "" },
      { cat: "Apoio administrativo e serviços gerais", previsto: "conforme Plano", media: "", vac: "", medida: "" },
    ],
    formacao: ""
  },
  ocorrencias: { linhas: [{ data: "", ocorrencia: "", impacto: "", providencia: "", situacao: "" }] },
  financeiro: {
    transferido: "", rendimentos: "", utilizado: "", saldo: "", devolvido: "", reserva: "",
    despesas: [
      { grupo: "Material de consumo", previsto: FIXED.despesasPrevisto.material, executado: "", pct: "", variacao: "" },
      { grupo: "Serviços de terceiros - pessoa jurídica", previsto: FIXED.despesasPrevisto.servicos, executado: "", pct: "", variacao: "" },
      { grupo: "Diárias e passagens", previsto: FIXED.despesasPrevisto.diarias, executado: "", pct: "", variacao: "" },
      { grupo: "Vencimentos e salários", previsto: FIXED.despesasPrevisto.vencimentos, executado: "", pct: "", variacao: "" },
      { grupo: "Encargos sociais e provisões", previsto: FIXED.despesasPrevisto.encargos, executado: "", pct: "", variacao: "" },
    ],
    declaracao: ""
  },
  dificuldades: { linhas: [{ meta: "", desvio: "", causa: "", medida: "", resultado: "" }] },
  conclusao: { status: "integralmente cumprido", qtdAtingida: "", qtdParcial: "", qtdNao: "", continuidade: "" },
  declaracao: { municipio: "", data: "", nome: "", cargo: "Fundação de Apoio ao Menor Inhumense – FAMI" },
  anexos: { checks: Array(10).fill(false) as boolean[] }
};

type AppState = typeof initialState;

function fmtDate(d: string) {
  if (!d) return '[data]';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
function romanize(n: number) {
  const map: [string,number][] = [['X',10],['IX',9],['VIII',8],['VII',7],['VI',6],['V',5],['IV',4],['III',3],['II',2],['I',1]];
  for (const [r,v] of map) if (n===v) return r;
  return String(n);
}
function isStepFilled(state: AppState, id: string): boolean {
  const check = (v: any): boolean => {
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'boolean') return v;
    if (Array.isArray(v)) return v.some(x => typeof x==='object' ? check(x) : check(x));
    if (typeof v === 'object' && v !== null) return Object.values(v).some(check);
    return false;
  };
  return check((state as any)[id]);
}

/* ── Componentes base ── */
const Field = ({ label, value, onChange, type='text', hint='', textarea=false, locked=false }: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; hint?: string; textarea?: boolean; locked?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
      {label}
      {hint && <span className="font-normal text-slate-400 normal-case ml-1 italic">{hint}</span>}
      {locked && <span className="ml-2 px-2 py-0.5 bg-[#00735C]/10 text-[#00735C] text-[10px] font-bold rounded-full uppercase tracking-wide">fixo</span>}
    </label>
    {textarea ? (
      <textarea
        className={`w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#00735C] outline-none resize-y min-h-[80px] ${locked ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
        value={value} readOnly={locked}
        onChange={e => onChange?.(e.target.value)}
      />
    ) : (
      <input
        type={type}
        className={`w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#00735C] outline-none ${locked ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
        value={value} readOnly={locked}
        onChange={e => onChange?.(e.target.value)}
      />
    )}
  </div>
);

const SectionHead = ({ n, title, sub }: { n: number; title: string; sub: string }) => (
  <div className="mb-6">
    <div className="text-xs font-mono text-[#00735C] tracking-widest uppercase mb-1">Seção {n} de {STEPS.length}</div>
    <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
    <p className="text-sm text-slate-500 max-w-2xl">{sub}</p>
  </div>
);

const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-4 shadow-sm">
    {title && <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">{title}</h3>}
    {children}
  </div>
);

const tableHeaderCls = "text-left text-xs font-bold text-slate-500 uppercase p-2 border-b border-slate-200";
const tableCellCls   = "p-2 text-slate-700 text-sm";
const inputCls       = "w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-[#00735C] outline-none";

/* ── Seções ── */
const SecIdent = ({ s, set }: { s: AppState; set: (fn: (p: AppState) => AppState) => void }) => (
  <>
    <SectionHead n={1} title="Identificação da parceria"
      sub="Dados do instrumento jurídico. Os campos já conhecidos vêm preenchidos e bloqueados; complete o período de execução e o responsável pelo relatório." />
    <Card title="Dados fixos da parceria">
      <Field label="Instrumento" value={FIXED.instrumento} locked />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Processo SEI" value={FIXED.processoSei} locked />
        <Field label="Valor global" value={FIXED.valorGlobal} locked />
      </div>
      <Field label="Administração Pública" value={FIXED.administracao} locked />
      <Field label="OSC" value={FIXED.osc} locked />
      <Field label="Objeto" value={FIXED.objeto} locked textarea />
    </Card>
    <Card title="A preencher">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Período de execução — início" type="date" value={s.ident.periodoIni}
          onChange={v => set(p => ({ ...p, ident: { ...p.ident, periodoIni: v } }))} />
        <Field label="Período de execução — fim" type="date" value={s.ident.periodoFim}
          onChange={v => set(p => ({ ...p, ident: { ...p.ident, periodoFim: v } }))} />
      </div>
      <Field label="Responsável pelo relatório" hint="nome, cargo, telefone e e-mail institucional"
        value={s.ident.responsavel}
        onChange={v => set(p => ({ ...p, ident: { ...p.ident, responsavel: v } }))} />
    </Card>
  </>
);

const SecResumo = ({ s, set }: { s: AppState; set: (fn: (p: AppState) => AppState) => void }) => (
  <>
    <SectionHead n={2} title="Resumo executivo"
      sub="Em até 15 linhas: finalidade da parceria, implantação realizada, quantitativo de adolescentes atendidos, continuidade do serviço, principais resultados, metas não atingidas, intercorrências relevantes, situação financeira sintética e conclusão sobre o cumprimento do objeto." />
    <Card>
      <Field label="Síntese da OSC" hint="até ~15 linhas" textarea value={s.resumo.texto}
        onChange={v => set(p => ({ ...p, resumo: { texto: v } }))} />
    </Card>
  </>
);

const SecExecucao = ({ s, set }: { s: AppState; set: (fn: (p: AppState) => AppState) => void }) => (
  <>
    <SectionHead n={3} title="Execução do objeto" sub="Implantação do CASER Rio Verde e manutenção da gestão socioeducativa." />
    <Card title="3.1 Implantação do CASER Rio Verde">
      <Field label="Descrição" textarea value={s.execucao.implantacao}
        hint="mobilização logística, estruturação física, TI/videomonitoramento, mobiliário, suprimentos iniciais"
        onChange={v => set(p => ({ ...p, execucao: { ...p.execucao, implantacao: v } }))} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse mt-2">
          <thead><tr className="bg-slate-50">
            {['Entrega','Prazo','Situação','Evidência','Observação'].map(h => <th key={h} className={tableHeaderCls}>{h}</th>)}
          </tr></thead>
          <tbody>
            {s.execucao.entregas.map((e, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className={tableCellCls}>{e.nome}</td>
                <td className="p-2 text-slate-500 text-sm whitespace-nowrap">{e.prazo}</td>
                <td className="p-2">
                  <select className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#00735C] outline-none bg-white"
                    value={e.situacao}
                    onChange={ev => set(p => { const arr=[...p.execucao.entregas]; arr[i]={...arr[i],situacao:ev.target.value}; return {...p,execucao:{...p.execucao,entregas:arr}}; })}>
                    <option value="">—</option><option>Concluída</option><option>Em andamento</option><option>Pendente</option>
                  </select>
                </td>
                <td className="p-2"><input className={inputCls} value={e.evidencia} placeholder="Anexo"
                  onChange={ev => set(p => { const arr=[...p.execucao.entregas]; arr[i]={...arr[i],evidencia:ev.target.value}; return {...p,execucao:{...p.execucao,entregas:arr}}; })} /></td>
                <td className="p-2"><input className={inputCls} value={e.obs}
                  onChange={ev => set(p => { const arr=[...p.execucao.entregas]; arr[i]={...arr[i],obs:ev.target.value}; return {...p,execucao:{...p.execucao,entregas:arr}}; })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    <Card title="3.2 Manutenção da gestão socioeducativa">
      <Field label="Descrição" textarea value={s.execucao.manutencao}
        hint="acolhimento, diagnóstico, PIA, escolarização, saúde, atendimento psicossocial, fortalecimento familiar"
        onChange={v => set(p => ({ ...p, execucao: { ...p.execucao, manutencao: v } }))} />
    </Card>
  </>
);

const SecPublico = ({ s, set }: { s: AppState; set: (fn: (p: AppState) => AppState) => void }) => (
  <>
    <SectionHead n={4} title="Público atendido" sub="Movimentação mensal de adolescentes atendidos no período do relatório." />
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-slate-50">
            <th className={tableHeaderCls}>Informação</th>
            {s.publico.meses.map(m => <th key={m} className={`${tableHeaderCls} whitespace-nowrap`}>{m}</th>)}
            <th className={tableHeaderCls}>Total/média</th>
          </tr></thead>
          <tbody>
            {s.publico.linhas.map((l,i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="p-2 text-slate-700 text-sm whitespace-nowrap">{l.label}</td>
                {l.valores.map((v,j) => (
                  <td key={j} className="p-1">
                    <input className="w-16 border border-slate-200 rounded p-1.5 text-xs text-center focus:ring-2 focus:ring-[#00735C] outline-none" value={v}
                      onChange={ev => set(p => { const linhas=p.publico.linhas.map((ln,li)=>li===i?{...ln,valores:ln.valores.map((vv,ji)=>ji===j?ev.target.value:vv)}:ln); return {...p,publico:{...p.publico,linhas}}; })} />
                  </td>
                ))}
                <td className="p-1"><input className="w-20 border border-slate-200 rounded p-1.5 text-xs text-center focus:ring-2 focus:ring-[#00735C] outline-none" value={l.total}
                  onChange={ev => set(p => { const linhas=p.publico.linhas.map((ln,li)=>li===i?{...ln,total:ev.target.value}:ln); return {...p,publico:{...p.publico,linhas}}; })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    <Card title="Análise do perfil e da demanda">
      <Field label="Análise (sem dados pessoais identificáveis)" textarea value={s.publico.analise}
        onChange={v => set(p => ({ ...p, publico: { ...p.publico, analise: v } }))} />
    </Card>
  </>
);

const SecResultados = ({ s, set }: { s: AppState; set: (fn: (p: AppState) => AppState) => void }) => {
  const rows: { key: keyof typeof s.resultados; label: string }[] = [
    { key:'atingida', label:'Atingida' }, { key:'parcial', label:'Parcialmente atingida' },
    { key:'naoAtingida', label:'Não atingida' }, { key:'naoAplicavel', label:'Não aplicável' },
  ];
  return (
    <>
      <SectionHead n={5} title="Resultados e alcance das metas"
        sub="A Matriz de Indicadores integra o relatório como Anexo I. Aqui, a síntese por situação." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-slate-50">
              {['Situação','Quantidade','Indicadores','Justificativa/providência'].map(h=><th key={h} className={tableHeaderCls}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map(({ key, label }) => {
                const row = s.resultados[key] as { qtd:string; indic:string; just:string };
                return (
                  <tr key={key} className="border-b border-slate-100">
                    <td className="p-2 text-slate-700 text-sm whitespace-nowrap">{label}</td>
                    {(['qtd','indic','just'] as const).map(f => (
                      <td key={f} className="p-1">
                        <input className={inputCls} value={row[f]}
                          onChange={ev => set(p => ({ ...p, resultados: { ...p.resultados, [key]: { ...(p.resultados[key] as any), [f]: ev.target.value } } }))} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        {(['beneficios','impactos','satisfacao','sustentabilidade'] as const).map(f => (
          <Field key={f} textarea value={s.resultados[f] as string}
            label={f==='beneficios'?'Benefícios e resultados alcançados':f==='impactos'?'Impactos sociais observados':f==='satisfacao'?'Grau de satisfação do público-alvo e/ou das famílias':'Possibilidade de sustentabilidade e continuidade das ações'}
            hint={f==='satisfacao'?'instrumento, amostra e resultado, quando aferido':''}
            onChange={v => set(p => ({ ...p, resultados: { ...p.resultados, [f]: v } }))} />
        ))}
      </Card>
    </>
  );
};

const SecEquipe = ({ s, set }: { s: AppState; set: (fn: (p: AppState) => AppState) => void }) => (
  <>
    <SectionHead n={6} title="Equipe de trabalho" sub="Efetivo previsto e situação real da equipe no período." />
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-slate-50">
            {['Categoria','Previsto','Média em exercício','Vacâncias/afastamentos','Medida adotada'].map(h=><th key={h} className={tableHeaderCls}>{h}</th>)}
          </tr></thead>
          <tbody>
            {s.equipe.linhas.map((l,i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className={tableCellCls}>{l.cat}</td>
                <td className="p-2 text-slate-500 text-sm">{l.previsto}</td>
                {(['media','vac','medida'] as const).map(f => (
                  <td key={f} className="p-1">
                    <input className={inputCls} value={l[f]}
                      onChange={ev => set(p => { const linhas=p.equipe.linhas.map((ln,li)=>li===i?{...ln,[f]:ev.target.value}:ln); return {...p,equipe:{...p.equipe,linhas}}; })} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    <Card title="Formação continuada">
      <Field label="Descrição" textarea value={s.equipe.formacao}
        hint="quantidade de profissionais, carga horária, temas, percentual certificado"
        onChange={v => set(p => ({ ...p, equipe: { ...p.equipe, formacao: v } }))} />
    </Card>
  </>
);

const DynTable = ({ rows, cols, onAdd, onDel, onEdit }: {
  rows: Record<string,string>[]; cols: {key:string; label:string}[];
  onAdd:()=>void; onDel:(i:number)=>void; onEdit:(i:number,k:string,v:string)=>void;
}) => (
  <div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-slate-50">
          {cols.map(c=><th key={c.key} className={tableHeaderCls}>{c.label}</th>)}
          <th className="p-2 border-b border-slate-200 w-8"></th>
        </tr></thead>
        <tbody>
          {rows.map((row,i) => (
            <tr key={i} className="border-b border-slate-100">
              {cols.map(c=>(
                <td key={c.key} className="p-1">
                  <input className={inputCls} value={row[c.key]} onChange={ev=>onEdit(i,c.key,ev.target.value)} />
                </td>
              ))}
              <td className="p-1 text-center">
                <button onClick={()=>onDel(i)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors text-lg leading-none">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <button onClick={onAdd} className="mt-3 px-4 py-2 bg-[#00735C]/10 border border-[#00735C]/30 text-[#00735C] text-xs font-bold rounded-lg hover:bg-[#00735C]/20 transition-colors">
      + Adicionar linha
    </button>
  </div>
);

const SecOcorrencias = ({ s, set }: { s: AppState; set: (fn: (p: AppState) => AppState) => void }) => (
  <>
    <SectionHead n={7} title="Ocorrências relevantes, riscos e providências"
      sub="Não inserir informações pessoais sensíveis dos adolescentes." />
    <Card>
      <DynTable rows={s.ocorrencias.linhas}
        cols={[{key:'data',label:'Data/período'},{key:'ocorrencia',label:'Ocorrência ou risco'},{key:'impacto',label:'Impacto'},{key:'providencia',label:'Providência'},{key:'situacao',label:'Situação atual'}]}
        onAdd={()=>set(p=>({...p,ocorrencias:{linhas:[...p.ocorrencias.linhas,{data:'',ocorrencia:'',impacto:'',providencia:'',situacao:''}]}}))}
        onDel={i=>set(p=>({...p,ocorrencias:{linhas:p.ocorrencias.linhas.filter((_,li)=>li!==i)}}))}
        onEdit={(i,k,v)=>set(p=>({...p,ocorrencias:{linhas:p.ocorrencias.linhas.map((r,li)=>li===i?{...r,[k]:v}:r)}}))} />
    </Card>
  </>
);

const SecFinanceiro = ({ s, set }: { s: AppState; set: (fn: (p: AppState) => AppState) => void }) => (
  <>
    <SectionHead n={8} title="Execução financeira sintética"
      sub="Valores executados por grupo de despesa. Os valores previstos já vêm do Plano de Trabalho." />
    <Card title="Resumo">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Valor efetivamente transferido (R$)" hint="parcelas e datas" value={s.financeiro.transferido} onChange={v=>set(p=>({...p,financeiro:{...p.financeiro,transferido:v}}))} />
        <Field label="Rendimentos de aplicação (R$)" value={s.financeiro.rendimentos} onChange={v=>set(p=>({...p,financeiro:{...p.financeiro,rendimentos:v}}))} />
        <Field label="Valor utilizado no objeto (R$)" value={s.financeiro.utilizado} onChange={v=>set(p=>({...p,financeiro:{...p.financeiro,utilizado:v}}))} />
        <Field label="Saldo bancário final (R$)" value={s.financeiro.saldo} onChange={v=>set(p=>({...p,financeiro:{...p.financeiro,saldo:v}}))} />
        <Field label="Valor devolvido (R$)" hint="data e comprovante" value={s.financeiro.devolvido} onChange={v=>set(p=>({...p,financeiro:{...p.financeiro,devolvido:v}}))} />
        <Field label="Reserva/provisão verbas rescisórias (R$)" hint="memória de cálculo" value={s.financeiro.reserva} onChange={v=>set(p=>({...p,financeiro:{...p.financeiro,reserva:v}}))} />
      </div>
    </Card>
    <Card title="Execução por grupo de despesa">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-slate-50">
            {['Grupo de despesa','Previsto (R$)','Executado (R$)','%','Variação justificada'].map(h=><th key={h} className={tableHeaderCls}>{h}</th>)}
          </tr></thead>
          <tbody>
            {s.financeiro.despesas.map((d,i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="p-2 text-slate-700 text-sm">
                  {d.grupo}
                  <span className="ml-2 px-1.5 py-0.5 bg-[#00735C]/10 text-[#00735C] text-[10px] font-bold rounded-full">fixo</span>
                </td>
                <td className="p-2 text-slate-500 text-sm">{d.previsto}</td>
                {(['executado','pct','variacao'] as const).map(f=>(
                  <td key={f} className="p-1">
                    <input className={inputCls} value={d[f]}
                      onChange={ev=>set(p=>({...p,financeiro:{...p.financeiro,despesas:p.financeiro.despesas.map((dd,di)=>di===i?{...dd,[f]:ev.target.value}:dd)}}))} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    <Card>
      <Field label="Declaração sobre a aplicação dos recursos" textarea value={s.financeiro.declaracao}
        hint="aderência ao Plano de Trabalho, remanejamentos, despesas glosadas, conciliação bancária"
        onChange={v=>set(p=>({...p,financeiro:{...p.financeiro,declaracao:v}}))} />
    </Card>
  </>
);

const SecDificuldades = ({ s, set }: { s: AppState; set: (fn: (p: AppState) => AppState) => void }) => (
  <>
    <SectionHead n={9} title="Dificuldades, desvios e medidas corretivas"
      sub="Registre os desvios identificados em metas ou atividades e as providências adotadas." />
    <Card>
      <DynTable rows={s.dificuldades.linhas}
        cols={[{key:'meta',label:'Meta/atividade'},{key:'desvio',label:'Desvio identificado'},{key:'causa',label:'Causa'},{key:'medida',label:'Medida corretiva'},{key:'resultado',label:'Resultado/prazo'}]}
        onAdd={()=>set(p=>({...p,dificuldades:{linhas:[...p.dificuldades.linhas,{meta:'',desvio:'',causa:'',medida:'',resultado:''}]}}))}
        onDel={i=>set(p=>({...p,dificuldades:{linhas:p.dificuldades.linhas.filter((_,li)=>li!==i)}}))}
        onEdit={(i,k,v)=>set(p=>({...p,dificuldades:{linhas:p.dificuldades.linhas.map((r,li)=>li===i?{...r,[k]:v}:r)}}))} />
    </Card>
  </>
);

const SecConclusao = ({ s, set }: { s: AppState; set: (fn: (p: AppState) => AppState) => void }) => (
  <>
    <SectionHead n={10} title="Conclusão da OSC"
      sub="Manifestação final sobre o cumprimento do objeto e a continuidade do atendimento." />
    <Card>
      <div className="mb-4">
        <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Situação do objeto</label>
        <select className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#00735C] outline-none bg-white"
          value={s.conclusao.status} onChange={e=>set(p=>({...p,conclusao:{...p.conclusao,status:e.target.value}}))}>
          <option value="integralmente cumprido">Integralmente cumprido</option>
          <option value="cumprido com ressalvas">Cumprido com ressalvas</option>
          <option value="parcialmente cumprido">Parcialmente cumprido</option>
        </select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Metas alcançadas (qtd.)" value={s.conclusao.qtdAtingida} onChange={v=>set(p=>({...p,conclusao:{...p.conclusao,qtdAtingida:v}}))} />
        <Field label="Parcialmente alcançadas (qtd.)" value={s.conclusao.qtdParcial} onChange={v=>set(p=>({...p,conclusao:{...p.conclusao,qtdParcial:v}}))} />
        <Field label="Não alcançadas (qtd.)" value={s.conclusao.qtdNao} onChange={v=>set(p=>({...p,conclusao:{...p.conclusao,qtdNao:v}}))} />
      </div>
      <Field label="Continuidade do atendimento socioeducativo" textarea value={s.conclusao.continuidade}
        hint="necessidade, riscos e condições operacionais"
        onChange={v=>set(p=>({...p,conclusao:{...p.conclusao,continuidade:v}}))} />
    </Card>
  </>
);

const SecDeclaracao = ({ s, set }: { s: AppState; set: (fn: (p: AppState) => AppState) => void }) => (
  <>
    <SectionHead n={11} title="Declaração e assinatura"
      sub="Dados para a declaração final assinada pelo representante legal da OSC." />
    <Card>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Município" value={s.declaracao.municipio} onChange={v=>set(p=>({...p,declaracao:{...p.declaracao,municipio:v}}))} />
        <Field label="Data" type="date" value={s.declaracao.data} onChange={v=>set(p=>({...p,declaracao:{...p.declaracao,data:v}}))} />
      </div>
      <Field label="Nome do representante legal" value={s.declaracao.nome} onChange={v=>set(p=>({...p,declaracao:{...p.declaracao,nome:v}}))} />
      <Field label="Cargo / Instituição" value={s.declaracao.cargo} onChange={v=>set(p=>({...p,declaracao:{...p.declaracao,cargo:v}}))} />
    </Card>
  </>
);

const SecAnexos = ({ s, set, onPreview }: { s: AppState; set: (fn: (p: AppState) => AppState) => void; onPreview:()=>void }) => (
  <>
    <SectionHead n={12} title="Índice mínimo de anexos" sub="Marque os anexos que acompanham este relatório." />
    <Card>
      {ANEXOS_LIST.map((a,i) => (
        <div key={i} className="flex items-start gap-3 mb-3">
          <button onClick={()=>set(p=>{const checks=[...p.anexos.checks]; checks[i]=!checks[i]; return {...p,anexos:{checks}};})}
            className="mt-0.5 text-[#00735C] hover:text-[#005c4a] transition-colors flex-shrink-0">
            {s.anexos.checks[i] ? <CheckSquare size={18}/> : <Square size={18} className="text-slate-300"/>}
          </button>
          <span className="text-sm text-slate-700"><strong className="text-slate-500">Anexo {romanize(i+1)}</strong> — {a}</span>
        </div>
      ))}
    </Card>
    <div className="flex justify-end mt-4">
      <button onClick={onPreview}
        className="px-6 py-3 bg-[#00735C] text-white font-bold rounded-xl shadow-lg hover:bg-[#005c4a] transition-all">
        Gerar relatório final →
      </button>
    </div>
  </>
);

/* ── Preview impressão ── */
const Preview = ({ s, onBack }: { s: AppState; onBack: () => void }) => {
  const esc = (v: string) => v || '—';
  const ts = { width:'100%', borderCollapse:'collapse' as const, marginBottom:12, fontSize:12 };
  const th = { border:'1px solid #999', padding:'5px 7px', background:'#eee', textAlign:'left' as const };
  const td = { border:'1px solid #999', padding:'5px 7px', textAlign:'left' as const, verticalAlign:'top' as const };
  const h2s = { fontSize:14, textTransform:'uppercase' as const, borderBottom:'1.5px solid #1a1a1a', paddingBottom:4, margin:'24px 0 10px' };
  return (
    <div>
      <div className="flex gap-3 justify-between items-center mb-6 sticky top-0 bg-[#f8fafc] py-3 z-10 border-b border-slate-200">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
          <ArrowLeft size={16}/> Voltar ao formulário
        </button>
        <button onClick={()=>window.print()} className="flex items-center gap-2 px-5 py-2 bg-[#00735C] text-white font-bold rounded-xl hover:bg-[#005c4a] transition-all text-sm shadow-lg">
          <Printer size={16}/> Imprimir / Salvar PDF
        </button>
      </div>
      <div id="report-page" style={{background:'#fff',border:'1px solid #ddd',padding:'52px 56px',fontFamily:'"Times New Roman",serif',color:'#1a1a1a',fontSize:13,lineHeight:1.55,maxWidth:820,margin:'0 auto'}}>
        <h1 style={{fontSize:17,textAlign:'center',marginBottom:2}}>Relatório Final de Execução do Objeto</h1>
        <p style={{textAlign:'center',fontSize:12,color:'#444',marginBottom:24}}>{FIXED.instrumento} — Processo SEI {FIXED.processoSei}</p>
        <h2 style={h2s}>1. Identificação da parceria</h2>
        {[['Instrumento',FIXED.instrumento],['Processo SEI',FIXED.processoSei],['Administração Pública',FIXED.administracao],['OSC',FIXED.osc],['Objeto',FIXED.objeto],['Período de execução',`${fmtDate(s.ident.periodoIni)} a ${fmtDate(s.ident.periodoFim)}`],['Valor global',FIXED.valorGlobal],['Responsável',esc(s.ident.responsavel)]].map(([k,v])=>(
          <p key={k} style={{margin:'4px 0'}}><strong>{k}:</strong> {v}</p>
        ))}
        <h2 style={h2s}>2. Resumo executivo</h2>
        <p style={{whiteSpace:'pre-wrap'}}>{esc(s.resumo.texto)}</p>
        <h2 style={h2s}>3. Execução do objeto</h2>
        <p><em>3.1 Implantação</em></p><p style={{whiteSpace:'pre-wrap'}}>{esc(s.execucao.implantacao)}</p>
        <table style={ts}><thead><tr>{['Entrega','Prazo','Situação','Evidência','Observação'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{s.execucao.entregas.map((e,i)=><tr key={i}>{[e.nome,e.prazo,e.situacao||'—',e.evidencia||'—',e.obs||'—'].map((v,j)=><td key={j} style={td}>{v}</td>)}</tr>)}</tbody></table>
        <p><em>3.2 Manutenção</em></p><p style={{whiteSpace:'pre-wrap'}}>{esc(s.execucao.manutencao)}</p>
        <h2 style={h2s}>4. Público atendido</h2>
        <table style={ts}><thead><tr><th style={th}>Informação</th>{s.publico.meses.map(m=><th key={m} style={th}>{m}</th>)}<th style={th}>Total/média</th></tr></thead>
          <tbody>{s.publico.linhas.map((l,i)=><tr key={i}><td style={td}>{l.label}</td>{l.valores.map((v,j)=><td key={j} style={td}>{v||'—'}</td>)}<td style={td}>{l.total||'—'}</td></tr>)}</tbody></table>
        <p><strong>Análise:</strong> {esc(s.publico.analise)}</p>
        <h2 style={h2s}>5. Resultados e alcance das metas</h2>
        <table style={ts}><thead><tr>{['Situação','Quantidade','Indicadores','Justificativa/providência'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{[['Atingida',s.resultados.atingida],['Parcialmente atingida',s.resultados.parcial],['Não atingida',s.resultados.naoAtingida],['Não aplicável',s.resultados.naoAplicavel]].map(([label,r]:any)=>(
            <tr key={label}><td style={td}>{label}</td><td style={td}>{r.qtd||'—'}</td><td style={td}>{r.indic||'—'}</td><td style={td}>{r.just||'—'}</td></tr>
          ))}</tbody></table>
        <p><strong>Benefícios:</strong> {esc(s.resultados.beneficios)}</p>
        <p><strong>Impactos sociais:</strong> {esc(s.resultados.impactos)}</p>
        <p><strong>Grau de satisfação:</strong> {esc(s.resultados.satisfacao)}</p>
        <p><strong>Sustentabilidade:</strong> {esc(s.resultados.sustentabilidade)}</p>
        <h2 style={h2s}>6. Equipe de trabalho</h2>
        <table style={ts}><thead><tr>{['Categoria','Previsto','Média em exercício','Vacâncias','Medida adotada'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{s.equipe.linhas.map((l,i)=><tr key={i}><td style={td}>{l.cat}</td><td style={td}>{l.previsto}</td><td style={td}>{l.media||'—'}</td><td style={td}>{l.vac||'—'}</td><td style={td}>{l.medida||'—'}</td></tr>)}</tbody></table>
        <p><strong>Formação continuada:</strong> {esc(s.equipe.formacao)}</p>
        <h2 style={h2s}>7. Ocorrências relevantes</h2>
        <table style={ts}><thead><tr>{['Data/período','Ocorrência/risco','Impacto','Providência','Situação atual'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{s.ocorrencias.linhas.map((r,i)=><tr key={i}><td style={td}>{r.data||'—'}</td><td style={td}>{r.ocorrencia||'—'}</td><td style={td}>{r.impacto||'—'}</td><td style={td}>{r.providencia||'—'}</td><td style={td}>{r.situacao||'—'}</td></tr>)}</tbody></table>
        <h2 style={h2s}>8. Execução financeira sintética</h2>
        <table style={ts}><thead><tr><th style={th}>Informação</th><th style={th}>Valor (R$)</th></tr></thead>
          <tbody>{[['Valor global pactuado',FIXED.valorGlobal],['Valor efetivamente transferido',s.financeiro.transferido],['Rendimentos de aplicação',s.financeiro.rendimentos],['Valor utilizado no objeto',s.financeiro.utilizado],['Saldo bancário final',s.financeiro.saldo],['Valor devolvido',s.financeiro.devolvido],['Reserva/provisão verbas rescisórias',s.financeiro.reserva]].map(([k,v])=>(
            <tr key={k}><td style={td}>{k}</td><td style={td}>{v||'—'}</td></tr>
          ))}</tbody></table>
        <table style={ts}><thead><tr>{['Grupo de despesa','Previsto (R$)','Executado (R$)','%','Variação justificada'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{s.financeiro.despesas.map((d,i)=><tr key={i}><td style={td}>{d.grupo}</td><td style={td}>{d.previsto}</td><td style={td}>{d.executado||'—'}</td><td style={td}>{d.pct||'—'}</td><td style={td}>{d.variacao||'—'}</td></tr>)}</tbody></table>
        <p><strong>Declaração sobre a aplicação dos recursos:</strong> {esc(s.financeiro.declaracao)}</p>
        <h2 style={h2s}>9. Dificuldades, desvios e medidas corretivas</h2>
        <table style={ts}><thead><tr>{['Meta/atividade','Desvio identificado','Causa','Medida corretiva','Resultado/prazo'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{s.dificuldades.linhas.map((r,i)=><tr key={i}><td style={td}>{r.meta||'—'}</td><td style={td}>{r.desvio||'—'}</td><td style={td}>{r.causa||'—'}</td><td style={td}>{r.medida||'—'}</td><td style={td}>{r.resultado||'—'}</td></tr>)}</tbody></table>
        <h2 style={h2s}>10. Conclusão da OSC</h2>
        <p>À vista das atividades descritas e das evidências anexadas, a Organização da Sociedade Civil conclui que o objeto do {FIXED.instrumento} foi <strong>{s.conclusao.status}</strong>, tendo sido alcançadas {s.conclusao.qtdAtingida||'[ ]'} metas, parcialmente alcançadas {s.conclusao.qtdParcial||'[ ]'} e não alcançadas {s.conclusao.qtdNao||'[ ]'}.</p>
        <p><strong>Continuidade do atendimento socioeducativo:</strong> {esc(s.conclusao.continuidade)}</p>
        <h2 style={h2s}>11. Declaração e assinatura</h2>
        <p>Declaro, sob as penas da lei, que as informações constantes deste Relatório Final de Execução do Objeto são verdadeiras, correspondem aos registros da parceria e estão acompanhadas das evidências necessárias à verificação do cumprimento do objeto e do alcance das metas.</p>
        <p>{esc(s.declaracao.municipio)||'[Município]'}, {fmtDate(s.declaracao.data)}.</p>
        <div style={{marginTop:60,textAlign:'center'}}>
          <div style={{width:320,margin:'0 auto',borderTop:'1px solid #1a1a1a',paddingTop:6}}>
            {esc(s.declaracao.nome)}<br/>{esc(s.declaracao.cargo)}
          </div>
        </div>
        <h2 style={h2s}>12. Índice mínimo de anexos</h2>
        <ul style={{paddingLeft:18}}>
          {ANEXOS_LIST.map((a,i)=><li key={i} style={{marginBottom:4}}>{s.anexos.checks[i]?'☑':'☐'} Anexo {romanize(i+1)} — {a}</li>)}
        </ul>
      </div>
    </div>
  );
};

/* ============================================================
   COMPONENTE PRINCIPAL — sem layout próprio, integra ao App
   ============================================================ */
export default function RelatorioFinal({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<AppState>(initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const set = useCallback((fn: (p: AppState) => AppState) => setState(fn), []);

  const progress = Math.round((STEPS.filter(s => isStepFilled(state, s.id)).length / STEPS.length) * 100);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='relatorio-final-progresso.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { setState(s=>({...s,...JSON.parse(reader.result as string)})); } catch { alert('Arquivo inválido.'); } };
    reader.readAsText(file);
  };

  const renderSection = () => {
    const id = STEPS[currentStep].id;
    const props = { s: state, set };
    switch(id) {
      case 'ident':        return <SecIdent {...props}/>;
      case 'resumo':       return <SecResumo {...props}/>;
      case 'execucao':     return <SecExecucao {...props}/>;
      case 'publico':      return <SecPublico {...props}/>;
      case 'resultados':   return <SecResultados {...props}/>;
      case 'equipe':       return <SecEquipe {...props}/>;
      case 'ocorrencias':  return <SecOcorrencias {...props}/>;
      case 'financeiro':   return <SecFinanceiro {...props}/>;
      case 'dificuldades': return <SecDificuldades {...props}/>;
      case 'conclusao':    return <SecConclusao {...props}/>;
      case 'declaracao':   return <SecDeclaracao {...props}/>;
      case 'anexos':       return <SecAnexos {...props} onPreview={()=>setShowPreview(true)}/>;
      default: return null;
    }
  };

  if (showPreview) return <Preview s={state} onBack={()=>setShowPreview(false)}/>;

  return (
    /* ── Sem min-h-screen próprio; usa o container do App ── */
    <div className="flex gap-6 items-start">

      {/* ── Sidebar verde SEDS ── */}
      <aside className="w-64 bg-[#00735C] text-white rounded-2xl shadow-lg flex-shrink-0 sticky top-4 overflow-hidden">

        {/* Cabeçalho sidebar */}
        <div className="p-5 border-b border-white/15">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">TC</div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-white/60 block">SEDS · Goiás</span>
              <span className="text-sm font-bold text-white">Relatório Final</span>
            </div>
          </div>
        </div>

        {/* Progresso */}
        <div className="px-5 py-3 border-b border-white/15">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/60 uppercase tracking-wider text-[10px]">Preenchimento</span>
            <span className="text-white font-bold text-[10px]">{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-500 rounded-full" style={{width:`${progress}%`}}/>
          </div>
        </div>

        {/* Steps */}
        <nav className="p-3">
          {STEPS.map((s,i) => {
            const done = isStepFilled(state, s.id);
            const active = i === currentStep;
            return (
              <button key={s.id} onClick={()=>setCurrentStep(i)}
                className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl mb-0.5 text-left transition-all ${active ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/70'}`}>
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] flex-shrink-0 mt-0.5 font-bold
                  ${done ? 'bg-[#FCD951] border-[#FCD951] text-[#00735C]' : active ? 'border-white text-white' : 'border-white/30 text-white/40'}`}>
                  {done ? '✓' : i+1}
                </span>
                <span className={`text-xs leading-tight pt-0.5 ${active ? 'font-bold' : ''}`}>{s.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Ações */}
        <div className="p-4 border-t border-white/15 space-y-2">
          <button onClick={handleExport} className="w-full flex items-center gap-2 px-3 py-2 text-xs border border-white/25 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all">
            <Download size={12}/> Salvar progresso (.json)
          </button>
          <label className="w-full flex items-center gap-2 px-3 py-2 text-xs border border-white/25 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
            <Upload size={12}/> Carregar progresso
            <input type="file" accept=".json" className="hidden" onChange={handleImport}/>
          </label>
        </div>
      </aside>

      {/* ── Conteúdo principal ── */}
      <main className="flex-1 min-w-0">
        {renderSection()}

        {/* Navegação */}
        {STEPS[currentStep].id !== 'anexos' && (
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <button onClick={()=>setCurrentStep(i=>Math.max(0,i-1))} disabled={currentStep===0}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <ChevronLeft size={16}/> Voltar
            </button>
            <button onClick={()=>setCurrentStep(i=>Math.min(STEPS.length-1,i+1))}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#00735C] text-white font-bold rounded-xl hover:bg-[#005c4a] transition-all text-sm shadow-lg">
              Continuar <ChevronRight size={16}/>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
