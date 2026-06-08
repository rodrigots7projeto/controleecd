'use client'
import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { atualizarStatusObrigacao } from '@/app/actions/obrigacoes'

type Empresa = {
  id: string
  empresa: string
  cnpj: string
  responsavel: string | null
  auxiliar: string | null
  prioridade: string
  prazo: Date | null
  ecd_status: string
  ecf_status: string
  recibo_ecd: string | null
  recibo_ecf: string | null
  comentario_ecd: string | null
  comentario_ecf: string | null
  situacao_empresa: string
}

type Props = {
  empresas: Empresa[]
  perfil: string
  nome: string
  tipoFixo?: 'ECD' | 'ECF'
}

// Prazos legais fixos (mês, dia)
const PRAZOS = {
  ECD: { mes: 6,  dia: 30, label: '30/06' },
  ECF: { mes: 7,  dia: 31, label: '31/07' },
}

function calcularPrazo(mes: number, dia: number) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(hoje.getFullYear(), mes - 1, dia)
  if (hoje > alvo) alvo.setFullYear(alvo.getFullYear() + 1)
  const dias = Math.ceil((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  const ano = alvo.getFullYear()
  return { dias, ano, label: `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${ano}` }
}

function nivelAlerta(dias: number) {
  if (dias <= 0)  return { cor: 'bg-red-950 border-red-700',   texto: 'text-red-400',   badge: 'bg-red-700',   icone: '🚨', status: 'VENCIDO',   pulsa: true  }
  if (dias <= 7)  return { cor: 'bg-red-950 border-red-700',   texto: 'text-red-300',   badge: 'bg-red-700',   icone: '🔴', status: 'CRÍTICO',   pulsa: true  }
  if (dias <= 15) return { cor: 'bg-orange-950 border-orange-700', texto: 'text-orange-300', badge: 'bg-orange-700', icone: '🟠', status: 'URGENTE',   pulsa: false }
  if (dias <= 30) return { cor: 'bg-amber-950 border-amber-700',   texto: 'text-amber-300',  badge: 'bg-amber-700',  icone: '⚠️', status: 'ATENÇÃO',   pulsa: false }
  return             { cor: 'bg-green-950 border-green-800',   texto: 'text-green-300',  badge: 'bg-green-700',  icone: '✅', status: 'NO PRAZO',  pulsa: false }
}

function cardGrad(status: string) {
  switch (status) {
    case 'PENDENTE':            return 'from-red-950    via-red-900    to-red-800'
    case 'EM_ANDAMENTO':        return 'from-yellow-900 via-amber-800  to-amber-700'
    case 'ENTREGUE':            return 'from-green-950  via-green-900  to-green-800'
    case 'DISPENSADA':          return 'from-gray-800   via-gray-700   to-gray-600'
    case 'ENTREGUE_RETIFICAR':  return 'from-blue-900   via-blue-800   to-blue-700'
    case 'RETIFICADO_OK':       return 'from-emerald-900 via-emerald-800 to-green-700'
    default:                    return 'from-gray-800   via-gray-700   to-gray-600'
  }
}

function getStatus(status: string) {
  switch (status) {
    case 'ENTREGUE':           return { label: 'ENVIADA',          bg: 'bg-green-600',   dot: 'bg-green-400'   }
    case 'EM_ANDAMENTO':       return { label: 'EM ANDAMENTO',     bg: 'bg-amber-600',   dot: 'bg-amber-400'   }
    case 'DISPENSADA':         return { label: 'DISPENSADA',       bg: 'bg-gray-600',    dot: 'bg-gray-400'    }
    case 'ENTREGUE_RETIFICAR': return { label: 'RETIFICAR',        bg: 'bg-blue-600',    dot: 'bg-blue-400'    }
    case 'RETIFICADO_OK':      return { label: 'RETIFICADO ✓',     bg: 'bg-emerald-600', dot: 'bg-emerald-400' }
    default:                   return { label: 'PENDENTE',         bg: 'bg-red-700',     dot: 'bg-red-400'     }
  }
}

function getRecibo(recibo: string | null, status: string) {
  if (recibo)                                                   return { label: 'RECIBO DISPONÍVEL',   bg: 'bg-green-700/80 border-green-500', icon: '↓' }
  if (status === 'ENTREGUE' || status === 'RETIFICADO_OK')      return { label: 'RECIBO INDISPONÍVEL', bg: 'bg-red-800/80 border-red-600',    icon: '⚠' }
  return                                                               { label: 'RECIBO PENDENTE',     bg: 'bg-gray-800/80 border-gray-600',  icon: '⏳' }
}

const TIPO_CONFIG = {
  ECD: {
    label: 'ECD', fullLabel: 'Escrituração Contábil Digital',
    accent: 'text-amber-300', gradient: 'from-stone-900 via-amber-950 to-yellow-950',
    bar: 'from-amber-600 to-yellow-400', icon: '📚',
  },
  ECF: {
    label: 'ECF', fullLabel: 'Escrituração Contábil Fiscal',
    accent: 'text-blue-300', gradient: 'from-slate-900 via-blue-950 to-indigo-950',
    bar: 'from-blue-600 to-indigo-400', icon: '⚙️',
  },
}

export default function ControleObrigacoes({ empresas, tipoFixo }: Props) {
  const [statusFiltro, setStatusFiltro] = useState('TODOS')
  const [busca, setBusca] = useState('')

  // Modal de edição
  const [modal,           setModal]           = useState<Empresa | null>(null)
  const [modalStatus,     setModalStatus]     = useState('')
  const [modalRecibo,     setModalRecibo]     = useState<string | null>(null)
  const [modalComentario, setModalComentario] = useState('')
  const [uploadLoading,   setUploadLoading]   = useState(false)
  const [saveLoading,     setSaveLoading]     = useState(false)
  const [saveMsg,         setSaveMsg]         = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function openModal(e: Empresa) {
    const status     = tipoFixo === 'ECF' ? e.ecf_status     : e.ecd_status
    const recibo     = tipoFixo === 'ECF' ? e.recibo_ecf     : e.recibo_ecd
    const comentario = tipoFixo === 'ECF' ? e.comentario_ecf : e.comentario_ecd
    setModal(e)
    setModalStatus(status)
    setModalRecibo(recibo)
    setModalComentario(comentario ?? '')
    setSaveMsg('')
  }

  function closeModal() { setModal(null); setSaveMsg('') }

  async function handleUpload(file: File) {
    setUploadLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('empresaId', modal!.id)
    fd.append('tipo', tipo)
    const res  = await fetch('/api/upload-recibo', { method: 'POST', body: fd })
    const json = await res.json()
    setUploadLoading(false)
    if (json.path) setModalRecibo(json.path)
    else alert(json.error ?? 'Erro ao enviar arquivo')
  }

  async function handleSave() {
    if (!modal) return
    setSaveLoading(true)
    setSaveMsg('')
    const result = await atualizarStatusObrigacao(
      modal.id, tipo, modalStatus, modalRecibo, modalComentario || null
    )
    setSaveLoading(false)
    if (result?.ok) {
      setSaveMsg('Salvo com sucesso!')
      if (tipo === 'ECD') {
        modal.ecd_status     = modalStatus
        modal.recibo_ecd     = modalRecibo
        modal.comentario_ecd = modalComentario || null
      } else {
        modal.ecf_status     = modalStatus
        modal.recibo_ecf     = modalRecibo
        modal.comentario_ecf = modalComentario || null
      }
      setTimeout(closeModal, 1200)
    } else {
      setSaveMsg(result?.error ?? 'Erro ao salvar.')
    }
  }

  const tipo = tipoFixo ?? 'ECD'
  const cfg = TIPO_CONFIG[tipo]

  // Calcula prazo legal
  const prazoInfo = useMemo(() => {
    const p = PRAZOS[tipo]
    return calcularPrazo(p.mes, p.dia)
  }, [tipo])
  const alerta = nivelAlerta(prazoInfo.dias)

  const filtradas = empresas.filter(e => {
    const status = tipo === 'ECD' ? e.ecd_status : e.ecf_status
    const passaStatus = statusFiltro === 'TODOS' || status === statusFiltro
    const passBusca = !busca || e.empresa.toLowerCase().includes(busca.toLowerCase()) || e.cnpj.includes(busca)
    return passaStatus && passBusca
  })

  const total = empresas.length
  const entregues = empresas.filter(e => (tipo === 'ECD' ? e.ecd_status : e.ecf_status) === 'ENTREGUE').length
  const pendentes = empresas.filter(e => (tipo === 'ECD' ? e.ecd_status : e.ecf_status) === 'PENDENTE').length
  const emRevisao = empresas.filter(e => (tipo === 'ECD' ? e.ecd_status : e.ecf_status) === 'EM_ANDAMENTO').length
  const pct = total > 0 ? Math.round((entregues / total) * 100) : 0

  return (
    <div className="min-h-full bg-gray-950 text-white flex flex-col">

      {/* Banner do tipo */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${cfg.gradient} px-8 py-5`}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        <div className="absolute right-8 top-3 text-7xl opacity-10">{cfg.icon}</div>

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <Link
              href="/dashboard/obrigacoes"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition shrink-0"
              title="Voltar à seleção"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <p className="text-5xl font-black text-white tracking-tight leading-none">{cfg.label}</p>
              <p className={`text-sm font-medium mt-0.5 ${cfg.accent}`}>{cfg.fullLabel}</p>
            </div>
          </div>

          {/* Mini progress */}
          <div className="text-right hidden sm:block">
            <p className={`text-3xl font-black ${cfg.accent}`}>{pct}%</p>
            <p className="text-xs text-gray-400 mb-1">concluído</p>
            <div className="w-36 h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="relative flex gap-5 mt-3 text-xs">
          <span className="text-green-400 font-semibold">✓ {entregues} enviadas</span>
          <span className="text-amber-400">⟳ {emRevisao} em revisão</span>
          <span className="text-gray-400">○ {pendentes} pendentes</span>
          <span className="text-gray-500">/ {total} total</span>
        </div>
      </div>

      {/* ===== ALERTA DE PRAZO ===== */}
      <div className={`border-b ${alerta.cor} border px-6 py-3 flex items-center justify-between flex-wrap gap-3`}>
        <div className="flex items-center gap-3">
          <span className={`text-xl ${alerta.pulsa ? 'animate-pulse' : ''}`}>{alerta.icone}</span>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest ${alerta.texto}`}>
              Prazo Legal — {tipo}
            </p>
            <p className="text-white font-bold text-sm">
              Vencimento: <span className={alerta.texto}>{prazoInfo.label}</span>
            </p>
          </div>
        </div>

        {/* Contagem regressiva */}
        <div className="flex items-center gap-3">
          <div className={`flex flex-col items-center px-5 py-2 rounded-xl border ${alerta.cor} ${alerta.pulsa ? 'animate-pulse' : ''}`}>
            <span className={`text-3xl font-black leading-none ${alerta.texto}`}>
              {prazoInfo.dias <= 0 ? '0' : prazoInfo.dias}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${alerta.texto}`}>
              {prazoInfo.dias <= 0 ? 'PRAZO VENCIDO' : prazoInfo.dias === 1 ? 'DIA RESTANTE' : 'DIAS RESTANTES'}
            </span>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold ${alerta.badge} text-white`}>
            {alerta.status}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-800 flex-wrap bg-gray-900/60">
        <span className="text-xs font-semibold text-gray-400">STATUS:</span>
        {[
          { val: 'TODOS',              label: 'TODOS' },
          { val: 'PENDENTE',           label: 'PENDENTE' },
          { val: 'EM_ANDAMENTO',       label: 'EM ANDAMENTO' },
          { val: 'ENTREGUE',           label: 'ENTREGUE' },
          { val: 'ENTREGUE_RETIFICAR', label: 'RETIFICAR' },
          { val: 'RETIFICADO_OK',      label: 'RETIFICADO' },
          { val: 'DISPENSADA',         label: 'DISPENSADA' },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setStatusFiltro(val)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              statusFiltro === val
                ? val === 'TODOS'              ? 'bg-white text-gray-900'
                : val === 'PENDENTE'           ? 'bg-red-600 text-white'
                : val === 'EM_ANDAMENTO'       ? 'bg-amber-600 text-white'
                : val === 'ENTREGUE'           ? 'bg-green-600 text-white'
                : val === 'ENTREGUE_RETIFICAR' ? 'bg-blue-600 text-white'
                : val === 'RETIFICADO_OK'      ? 'bg-emerald-600 text-white'
                : 'bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1.5 border border-gray-700">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            placeholder="Buscar empresa ou CNPJ..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-gray-500 outline-none w-44"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-gray-500 hover:text-white transition text-xs">✕</button>
          )}
        </div>
        <span className="text-xs text-gray-500">{filtradas.length} empresa(s)</span>
      </div>

      {/* Grid de cards */}
      <div className="flex-1 p-6">
        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Nenhuma empresa encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {filtradas.map((e) => {
              const status = tipo === 'ECD' ? e.ecd_status : e.ecf_status
              const recibo = tipo === 'ECD' ? e.recibo_ecd : e.recibo_ecf
              const st = getStatus(status)
              const rc = getRecibo(recibo, status)
              const grad = cardGrad(status)

              return (
                <div
                  key={e.id}
                  onClick={() => openModal(e)}
                  className={`relative overflow-hidden rounded-xl bg-gradient-to-b ${grad} aspect-[3/4] flex flex-col justify-end hover:scale-105 hover:brightness-110 transition-all duration-200 shadow-lg cursor-pointer group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Ícone de edição no hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>

                  <div className="relative p-3 space-y-1.5">
                    {/* Nome da empresa — destaque principal */}
                    <p className="text-white text-[13px] font-bold leading-tight line-clamp-3 drop-shadow-md" title={e.empresa}>
                      {e.empresa}
                    </p>
                    <p className="text-white/50 text-[9px] font-mono">{e.cnpj}</p>

                    {/* Status badge */}
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${st.bg} text-white`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot} shrink-0`} />
                      {st.label}
                    </span>

                    {/* Recibo */}
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${rc.bg} text-white`}>
                      <span className="text-[9px] shrink-0">{rc.icon}</span>
                      <span className="truncate">{rc.label}</span>
                    </span>

                    {/* Indicador de comentário */}
                    {(tipo === 'ECD' ? e.comentario_ecd : e.comentario_ecf) && (
                      <div className="flex items-center gap-1 text-yellow-300/80">
                        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                        <span className="text-[9px] font-semibold">Comentário</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MODAL DE EDIÇÃO DE STATUS / COMPROVANTE
          ══════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />

          {/* Painel */}
          <div className="relative w-full max-w-md bg-gray-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

            {/* Header do modal */}
            <div className={`px-6 py-4 bg-gradient-to-r ${cfg.gradient} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase">{cfg.label} — Atualizar Obrigação</p>
                  <p className="text-white font-bold text-base leading-tight mt-0.5">{modal.empresa}</p>
                  <p className="text-white/50 text-[11px] font-mono mt-0.5">{modal.cnpj}</p>
                </div>
                <button onClick={closeModal} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">

              {/* ── Seleção de status ── */}
              <div>
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-3">Status {cfg.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'PENDENTE',            label: 'Pendente',            color: 'border-red-600     bg-red-950     text-red-300',     active: 'ring-2 ring-red-500'     },
                    { val: 'EM_ANDAMENTO',         label: 'Em Andamento',        color: 'border-amber-600   bg-amber-950   text-amber-300',   active: 'ring-2 ring-amber-500'   },
                    { val: 'ENTREGUE',             label: 'Entregue',            color: 'border-green-600   bg-green-950   text-green-300',   active: 'ring-2 ring-green-500'   },
                    { val: 'DISPENSADA',           label: 'Dispensada',          color: 'border-slate-600   bg-slate-800   text-slate-300',   active: 'ring-2 ring-slate-400'   },
                    { val: 'ENTREGUE_RETIFICAR',   label: 'Entregue — Retificar',color: 'border-blue-600    bg-blue-950    text-blue-300',    active: 'ring-2 ring-blue-500'    },
                    { val: 'RETIFICADO_OK',        label: 'Retificado — OK',     color: 'border-emerald-500 bg-emerald-950 text-emerald-300', active: 'ring-2 ring-emerald-400' },
                  ].map(s => (
                    <button
                      key={s.val}
                      onClick={() => setModalStatus(s.val)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${s.color} ${modalStatus === s.val ? s.active : 'opacity-50 hover:opacity-80'}`}
                    >
                      {modalStatus === s.val && (
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Comprovante PDF ── */}
              <div>
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-3">Comprovante / Recibo (PDF)</p>

                {/* PDF já anexado */}
                {modalRecibo && (
                  <div className="flex items-center gap-3 bg-green-900/30 border border-green-700/40 rounded-xl px-4 py-3 mb-3">
                    <svg className="w-8 h-8 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 17v-2h8v2H8zm0-4v-2h8v2H8z"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-green-400 text-xs font-semibold">Comprovante anexado</p>
                      <p className="text-slate-400 text-[10px] truncate">{modalRecibo.split('/').pop()}</p>
                    </div>
                    <a
                      href={modalRecibo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[10px] font-bold text-blue-400 hover:text-blue-300 border border-blue-700/50 rounded-lg px-2.5 py-1.5 transition"
                    >
                      Abrir
                    </a>
                  </div>
                )}

                {/* Upload zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer transition group"
                >
                  {uploadLoading ? (
                    <div className="flex items-center justify-center gap-2 text-blue-400">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      <span className="text-sm font-semibold">Enviando...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-slate-500 group-hover:text-blue-400 transition mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-slate-400 text-xs group-hover:text-blue-300 transition font-semibold">
                        {modalRecibo ? 'Substituir comprovante' : 'Clique para anexar o PDF'}
                      </p>
                      <p className="text-slate-600 text-[10px] mt-1">Somente PDF · máx. 10 MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
                  />
                </div>
              </div>

              {/* ── Comentário ── */}
              <div>
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2">Comentário / Observação</p>
                <textarea
                  value={modalComentario}
                  onChange={e => setModalComentario(e.target.value)}
                  rows={3}
                  placeholder="Adicione uma observação sobre esta obrigação (opcional)..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Feedback */}
              {saveMsg && (
                <p className={`text-sm font-semibold text-center ${saveMsg.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>
                  {saveMsg}
                </p>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saveLoading || uploadLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  {saveLoading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Salvando...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> Salvar</>
                  )}
                </button>
                <button
                  onClick={closeModal}
                  className="px-5 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition"
                >
                  Cancelar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
