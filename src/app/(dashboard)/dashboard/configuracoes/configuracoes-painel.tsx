'use client'
import { Fragment, useState, useMemo, useRef, type ReactNode } from 'react'
import type { LogEntry } from './page'

type Props = {
  logs: LogEntry[]
  totalLogs: number
  totalEmpresas: number
  totalUsuarios: number
  empresasPorStatus: { situacao_empresa?: string; _count: number | { _all: number } }[]
  empresasEcd: { ecd_status?: string; _count: number | { _all: number } }[]
  empresasEcf: { ecf_status?: string; _count: number | { _all: number } }[]
  adminNome: string
}

function cnt(v: number | { _all: number }): number {
  return typeof v === 'number' ? v : v._all
}

const OP_LABEL: Record<string, string> = {
  INSERT: 'Inserção', UPDATE: 'Alteração', DELETE: 'Exclusão',
  LOGIN: 'Login', LOGOUT: 'Logout', IMPORT: 'Importação',
  RESET: 'Reset', EXPORT: 'Exportação',
}
function opLabel(op: string) { return OP_LABEL[op.toUpperCase()] ?? op }

const OP_COLOR: Record<string, string> = {
  INSERT: 'text-green-400', UPDATE: 'text-amber-400', DELETE: 'text-red-400',
  LOGIN: 'text-blue-400', LOGOUT: 'text-slate-400', IMPORT: 'text-purple-400',
  RESET: 'text-orange-400', EXPORT: 'text-indigo-400',
}
function opColor(op: string) { return OP_COLOR[op.toUpperCase()] ?? 'text-gray-400' }

function sistemId() {
  return 'SISTEMA.ID.SISTEM: 123456/90000193'
}


export default function ConfiguracoesPainel({
  logs, totalLogs, totalEmpresas, totalUsuarios,
  empresasPorStatus, empresasEcd, empresasEcf, adminNome,
}: Props) {
  const [aba,             setAba]             = useState<'dashboard' | 'backup'>('dashboard')
  const [togglePrazos,    setTogglePrazos]    = useState(true)
  const [toggleCsll,      setToggleCsll]      = useState(true)
  const [toggleFiliais,   setToggleFiliais]   = useState(false)
  const [filtroOp,        setFiltroOp]        = useState('TODAS')
  const [busca,           setBusca]           = useState('')
  const [expandido,       setExpandido]       = useState<string | null>(null)
  const [pagina,          setPagina]          = useState(1)
  const POR_PAG = 10

  // ── Backup state ──
  const [backupLoading, setBackupLoading]   = useState(false)
  const [restoreFile,   setRestoreFile]     = useState<File | null>(null)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreMsg,    setRestoreMsg]      = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const ativasCount  = empresasPorStatus.find(e => e.situacao_empresa === 'ATIVA')?._count
  const inativasCount = empresasPorStatus.find(e => e.situacao_empresa === 'INATIVA')?._count
  const ecdEntregues = empresasEcd.find(e => e.ecd_status === 'ENTREGUE')?._count
  const ecfEntregues = empresasEcf.find(e => e.ecf_status === 'ENTREGUE')?._count

  const ativas  = cnt(ativasCount  ?? 0)
  const inativas = cnt(inativasCount ?? 0)
  const ecdOk   = cnt(ecdEntregues ?? 0)
  const ecfOk   = cnt(ecfEntregues ?? 0)

  const barStats = [
    { label: 'Ativas',    value: ativas,        max: totalEmpresas, color: 'bg-green-500' },
    { label: 'Inativas',  value: inativas,      max: totalEmpresas, color: 'bg-red-500'   },
    { label: 'ECD OK',    value: ecdOk,         max: totalEmpresas, color: 'bg-amber-500' },
    { label: 'ECF OK',    value: ecfOk,         max: totalEmpresas, color: 'bg-blue-500'  },
    { label: 'Usuários',  value: totalUsuarios,  max: 20,            color: 'bg-purple-500'},
    { label: 'Logs',      value: Math.min(totalLogs, 999), max: 1000, color: 'bg-cyan-500'},
  ]

  const operacoes = useMemo(
    () => ['TODAS', ...Array.from(new Set(logs.map(l => l.operacao.toUpperCase()))).sort()],
    [logs]
  )

  const filtrados = useMemo(() => logs.filter(l => {
    if (filtroOp !== 'TODAS' && l.operacao.toUpperCase() !== filtroOp) return false
    if (busca) {
      const b = busca.toLowerCase()
      return (
        l.usuario?.nome.toLowerCase().includes(b) ||
        l.usuario?.usuario.toLowerCase().includes(b) ||
        l.descricao?.toLowerCase().includes(b) ||
        l.empresa?.empresa.toLowerCase().includes(b) ||
        l.campo?.toLowerCase().includes(b) || false
      )
    }
    return true
  }), [logs, filtroOp, busca])

  const totalPags = Math.max(1, Math.ceil(filtrados.length / POR_PAG))
  const paginados = filtrados.slice((pagina - 1) * POR_PAG, pagina * POR_PAG)

  async function handleBackup() {
    setBackupLoading(true)
    try {
      const res = await fetch('/api/backup')
      if (!res.ok) throw new Error('Erro ao gerar backup')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      const date = new Date().toISOString().slice(0, 10)
      a.download = `backup-controleecd-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setBackupLoading(false)
    }
  }

  async function handleRestore() {
    if (!restoreFile) return
    setRestoreLoading(true)
    setRestoreMsg(null)
    try {
      const text = await restoreFile.text()
      const res  = await fetch('/api/restore', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    text,
      })
      const json = await res.json() as { ok?: boolean; error?: string; restored?: { usuarios: number; empresas: number; auditorias: number } }
      if (json.ok) {
        setRestoreMsg({
          ok:   true,
          text: `Backup restaurado com sucesso! ${json.restored?.usuarios} usuários, ${json.restored?.empresas} empresas, ${json.restored?.auditorias} logs.`,
        })
        setRestoreFile(null)
        if (fileRef.current) fileRef.current.value = ''
        setTimeout(() => window.location.reload(), 2500)
      } else {
        setRestoreMsg({ ok: false, text: json.error ?? 'Erro ao restaurar backup.' })
      }
    } catch {
      setRestoreMsg({ ok: false, text: 'Erro de conexão ao restaurar backup.' })
    } finally {
      setRestoreLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-gray-950 text-white flex flex-col">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 border-b border-slate-700 px-8 py-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-slate-400 uppercase mb-0.5">
              Controle de Obrigações (ECD/ECF)
            </p>
            <h1 className="text-2xl font-black tracking-widest text-white uppercase">Configurações</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Administrador</p>
              <p className="text-sm font-semibold text-white">{adminNome}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
              {adminNome.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="relative mt-4 flex gap-1">
          {([
            { key: 'dashboard', label: 'Dashboard', icon: (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            )},
            { key: 'backup', label: 'Backup', icon: (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            )},
          ] as { key: 'dashboard' | 'backup'; label: string; icon: ReactNode }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setAba(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-bold tracking-wide transition ${
                aba === t.key
                  ? 'bg-gray-950 text-white border-t border-l border-r border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.icon}
              {t.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── BACKUP TAB ── */}
      {aba === 'backup' && (
        <div className="flex-1 p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Fazer Backup */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 border border-slate-700 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center border border-green-500/30">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Exportar Backup</p>
                  <p className="text-[11px] text-slate-400">Gera um arquivo JSON com todos os dados</p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl border border-slate-700 p-4 mb-5 space-y-2">
                {[
                  { icon: '🏢', label: 'Empresas', desc: 'Todos os cadastros e status' },
                  { icon: '👤', label: 'Usuários', desc: 'Contas e permissões' },
                  { icon: '📋', label: 'Log de Auditoria', desc: 'Histórico de movimentações' },
                ].map(i => (
                  <div key={i.label} className="flex items-center gap-2.5">
                    <span className="text-base">{i.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-white">{i.label}</p>
                      <p className="text-[10px] text-slate-500">{i.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleBackup}
                disabled={backupLoading}
                className="w-full flex items-center justify-center gap-2.5 bg-green-700 hover:bg-green-600 disabled:bg-green-900 text-white font-bold py-3 rounded-xl transition"
              >
                {backupLoading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Gerando backup...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Baixar Backup (.json)</>
                )}
              </button>
            </div>

            {/* Restaurar Backup */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 border border-slate-700 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-600/20 rounded-xl flex items-center justify-center border border-amber-500/30">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Restaurar Backup</p>
                  <p className="text-[11px] text-slate-400">Importa um arquivo JSON gerado por este sistema</p>
                </div>
              </div>

              {/* Aviso */}
              <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/40 rounded-xl p-3 mb-5">
                <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-[11px] text-red-300 leading-relaxed">
                  <strong>Atenção:</strong> restaurar um backup irá substituir <strong>todos</strong> os dados atuais do sistema. Esta ação não pode ser desfeita.
                </p>
              </div>

              {/* Zona de upload */}
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition mb-5 ${
                  restoreFile
                    ? 'border-amber-500 bg-amber-900/20'
                    : 'border-slate-600 hover:border-slate-400 hover:bg-white/5'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={e => {
                    setRestoreFile(e.target.files?.[0] ?? null)
                    setRestoreMsg(null)
                  }}
                />
                {restoreFile ? (
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs font-semibold text-amber-300">{restoreFile.name}</p>
                    <p className="text-[10px] text-slate-400">{(restoreFile.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={e => { e.stopPropagation(); setRestoreFile(null); if (fileRef.current) fileRef.current.value = '' }}
                      className="text-[10px] text-red-400 hover:text-red-300 mt-1"
                    >
                      Remover arquivo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs text-slate-400">Clique para selecionar o arquivo de backup</p>
                    <p className="text-[10px] text-slate-600">Formato: .json</p>
                  </div>
                )}
              </div>

              {restoreMsg && (
                <div className={`flex items-start gap-2 rounded-xl p-3 mb-4 border ${restoreMsg.ok ? 'bg-green-900/20 border-green-700/40' : 'bg-red-900/20 border-red-700/40'}`}>
                  <svg className={`w-4 h-4 mt-0.5 shrink-0 ${restoreMsg.ok ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {restoreMsg.ok
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    }
                  </svg>
                  <p className={`text-[11px] leading-relaxed ${restoreMsg.ok ? 'text-green-300' : 'text-red-300'}`}>{restoreMsg.text}</p>
                </div>
              )}

              <button
                onClick={handleRestore}
                disabled={!restoreFile || restoreLoading}
                className="w-full flex items-center justify-center gap-2.5 bg-amber-700 hover:bg-amber-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition"
              >
                {restoreLoading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Restaurando...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> Restaurar Backup</>
                )}
              </button>
            </div>
          </div>

          {/* Info card */}
          <div className="rounded-2xl bg-black/30 border border-slate-700 p-5">
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-3">Como funciona o backup</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { num: '01', title: 'Exportar', desc: 'Clique em "Baixar Backup" para gerar um arquivo .json com todos os dados do sistema (empresas, usuários e logs).' },
                { num: '02', title: 'Guardar', desc: 'Salve o arquivo em local seguro (HD externo, nuvem, etc). Faça backups periódicos para não perder dados.' },
                { num: '03', title: 'Restaurar', desc: 'Em caso de perda de dados, acesse esta tela, selecione o arquivo .json e clique em "Restaurar Backup".' },
              ].map(s => (
                <div key={s.num} className="flex gap-3">
                  <span className="text-2xl font-black text-slate-700">{s.num}</span>
                  <div>
                    <p className="text-xs font-bold text-white mb-1">{s.title}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DASHBOARD TAB ── */}
      {aba === 'dashboard' && (
      <div className="flex-1 p-6 space-y-5">

        {/* ── HERO PANEL ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Sistema Info */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 border border-slate-700 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.2),transparent_70%)]" />
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-indigo-600/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-semibold tracking-widest text-green-400 uppercase">Online</span>
              </div>
              <p className="text-3xl font-black text-white leading-tight">SISTEMA</p>
              <p className="text-3xl font-black text-indigo-400 leading-tight">CONTROL LOG</p>
              <p className="text-[10px] text-slate-500 mt-3 font-mono">{sistemId()}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Empresas', value: totalEmpresas, color: 'text-amber-400' },
                  { label: 'Usuários Ativos', value: totalUsuarios, color: 'text-green-400' },
                  { label: 'Registros Log', value: totalLogs, color: 'text-blue-400' },
                  { label: 'ECD Entregues', value: ecdOk, color: 'text-purple-400' },
                ].map(s => (
                  <div key={s.label} className="bg-black/30 rounded-xl p-3 border border-slate-700">
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Barras de stats */}
          <div className="lg:col-span-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-5">Empresas e CNPJs — Visão Global</p>
            <div className="flex items-end gap-3 h-32">
              {barStats.map((b, i) => {
                const pct = b.max > 0 ? Math.round((b.value / b.max) * 100) : 0
                return (
                  <div key={b.label} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-[11px] font-bold text-white">{b.value}</span>
                    <div className="w-full bg-slate-700/60 rounded-t-md overflow-hidden" style={{ height: '80px' }}>
                      <div
                        className={`w-full ${b.color} rounded-t-md transition-all duration-700`}
                        style={{ height: `${Math.max(pct, 3)}%`, marginTop: `${100 - Math.max(pct, 3)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 text-center leading-tight">{b.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── MIDDLE ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Parâmetros do Sistema */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-5">Parâmetros do Sistema</p>
            <div className="space-y-4">
              {[
                {
                  key: 'prazos', label: 'Prazos de Alerta',
                  desc: 'Prazos de Alerta linha de Alerta', value: togglePrazos,
                  set: setTogglePrazos, icon: '⏰',
                },
                {
                  key: 'csll', label: 'Tipo de Cálculo CSLL/IRPJ',
                  desc: 'Tipo de lancot — Tipo de Cálculo CSLL/IRPJ', value: toggleCsll,
                  set: setToggleCsll, icon: '🧮',
                },
                {
                  key: 'filiais', label: 'Integração de Filiais',
                  desc: 'Integração de Filiais exceto para Integração de Filiais', value: toggleFiliais,
                  set: setToggleFiliais, icon: '🔗',
                },
              ].map(t => (
                <div key={t.key} className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{t.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 max-w-[220px] truncate">{t.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => t.set(!t.value)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${t.value ? 'bg-green-500' : 'bg-slate-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${t.value ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Suporte e Atualizações */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-5">Suporte e Atualizações</p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: '⚙️', label: 'VERSÃO DO SISTEMA',  sub: 'v1.0.0', color: 'from-indigo-800 to-indigo-900' },
                { icon: '🎧', label: 'SUPORTE TÉCNICO',    sub: 'Online',  color: 'from-blue-800 to-blue-900'    },
                { icon: '📄', label: 'DOCUMENTAÇÃO',       sub: 'Manual',  color: 'from-slate-700 to-slate-800'  },
              ].map(s => (
                <button
                  key={s.label}
                  className={`bg-gradient-to-b ${s.color} rounded-xl p-4 flex flex-col items-center gap-2 hover:brightness-110 transition border border-slate-600`}
                >
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-[9px] font-bold text-white tracking-wide text-center leading-tight">{s.label}</p>
                  <p className="text-[9px] text-slate-400">{s.sub}</p>
                </button>
              ))}
            </div>

            {/* Mini status do sistema */}
            <div className="bg-black/40 rounded-xl p-3 border border-slate-700 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status do Sistema</p>
              {[
                { label: 'Banco de Dados',   ok: true  },
                { label: 'Servidor',         ok: true  },
                { label: 'Importação Excel', ok: true  },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">{s.label}</span>
                  <span className={`flex items-center gap-1 text-[10px] font-semibold ${s.ok ? 'text-green-400' : 'text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                    {s.ok ? 'Operacional' : 'Erro'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── LOG DE AUDITORIA ── */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">

          {/* Log header */}
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-indigo-600/30 rounded-lg flex items-center justify-center border border-indigo-500/30">
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">Log de Auditoria</p>
                <p className="text-[10px] text-slate-500">
                  {filtrados.length} registro(s) filtrado(s) de {totalLogs} total
                </p>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-black/40 border border-slate-600 rounded-lg px-3 py-1.5">
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={busca}
                  onChange={e => { setBusca(e.target.value); setPagina(1) }}
                  placeholder="Buscar..."
                  className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-32"
                />
                {busca && <button onClick={() => setBusca('')} className="text-slate-500 hover:text-white text-xs">✕</button>}
              </div>

              <select
                value={filtroOp}
                onChange={e => { setFiltroOp(e.target.value); setPagina(1) }}
                className="bg-black/40 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none"
              >
                {operacoes.map(o => (
                  <option key={o} value={o}>{o === 'TODAS' ? 'Todas as ações' : opLabel(o)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/60 bg-black/20">
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider">Usuário</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider">Ação</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider">Módulo</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider">Detalhes</th>
                  <th className="text-center px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider">+</th>
                </tr>
              </thead>
              <tbody>
                {paginados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-600">
                      <svg className="w-10 h-10 mx-auto mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                      </svg>
                      Nenhum registro de auditoria
                    </td>
                  </tr>
                ) : (
                  paginados.map((log, idx) => {
                    const isOpen = expandido === log.id
                    const temDetalhes = log.campo || log.valor_antes || log.valor_depois
                    return (
                      <Fragment key={log.id}>
                        <tr
                          className={`border-b border-slate-800 transition hover:bg-white/5 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}
                        >
                          <td className="px-5 py-3 text-slate-400 font-mono whitespace-nowrap">
                            <span className="block">{new Date(log.data).toLocaleDateString('pt-BR')}</span>
                            <span className="text-slate-600 text-[10px]">{new Date(log.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="px-5 py-3">
                            {log.usuario ? (
                              <div>
                                <p className="text-white font-medium">{log.usuario.nome}</p>
                                <p className="text-slate-500 text-[10px]">@{log.usuario.usuario}</p>
                              </div>
                            ) : <span className="text-slate-600 italic">Sistema</span>}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`font-bold ${opColor(log.operacao)}`}>{opLabel(log.operacao)}</span>
                          </td>
                          <td className="px-5 py-3 text-slate-400 capitalize">{log.tabela}</td>
                          <td className="px-5 py-3 text-slate-400 max-w-[200px] truncate" title={log.descricao ?? undefined}>
                            {log.empresa ? (
                              <span className="text-slate-300">{log.empresa.empresa} </span>
                            ) : null}
                            {log.descricao ?? '—'}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {temDetalhes ? (
                              <button
                                onClick={() => setExpandido(isOpen ? null : log.id)}
                                className="text-indigo-400 hover:text-indigo-200 transition font-mono text-[10px] font-bold"
                              >
                                {isOpen ? '▲' : '▼'}
                              </button>
                            ) : <span className="text-slate-700">—</span>}
                          </td>
                        </tr>
                        {isOpen && temDetalhes && (
                          <tr className="bg-indigo-950/40 border-b border-slate-800">
                            <td colSpan={6} className="px-8 py-3">
                              <div className="flex flex-wrap gap-4 text-[11px]">
                                {log.campo && (
                                  <div>
                                    <span className="text-slate-500 mr-1">Campo:</span>
                                    <span className="text-indigo-300 font-mono">{log.campo}</span>
                                  </div>
                                )}
                                {log.valor_antes !== null && (
                                  <div>
                                    <span className="text-slate-500 mr-1">Antes:</span>
                                    <span className="text-red-400 font-mono">{log.valor_antes || '(vazio)'}</span>
                                  </div>
                                )}
                                {log.valor_depois !== null && (
                                  <div>
                                    <span className="text-slate-500 mr-1">Depois:</span>
                                    <span className="text-green-400 font-mono">{log.valor_depois || '(vazio)'}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-slate-500 mr-1">ID:</span>
                                  <span className="text-slate-400 font-mono">{log.registro_id}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPags > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/60 bg-black/20">
              <p className="text-[11px] text-slate-500">
                Pág {pagina} de {totalPags} — {filtrados.length} registros
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-3 py-1 text-xs rounded border border-slate-600 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  ←
                </button>
                {Array.from({ length: Math.min(5, totalPags) }, (_, i) => {
                  let p = i + 1
                  if (totalPags > 5) {
                    if (pagina <= 3) p = i + 1
                    else if (pagina >= totalPags - 2) p = totalPags - 4 + i
                    else p = pagina - 2 + i
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPagina(p)}
                      className={`w-7 h-7 text-xs rounded border transition ${
                        pagina === p ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPagina(p => Math.min(totalPags, p + 1))}
                  disabled={pagina === totalPags}
                  className="px-3 py-1 text-xs rounded border border-slate-600 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      )}

    </div>
  )
}
