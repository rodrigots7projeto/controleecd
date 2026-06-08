'use client'
import { useState } from 'react'
import Link from 'next/link'
import { alternarStatusUsuario, resetarSenha, excluirUsuario } from '@/app/actions/usuarios'

type Usuario = {
  id: string
  nome: string
  email: string
  usuario: string
  perfil: string
  status: string
  data_criacao: Date
  ultimo_acesso: Date | null
  primeiro_acesso: boolean
}

type Props = { usuarios: Usuario[]; currentUserId: string }

const AVATAR_COLORS = [
  'from-blue-600 to-blue-800',
  'from-emerald-600 to-emerald-800',
  'from-violet-600 to-violet-800',
  'from-amber-600 to-amber-800',
  'from-rose-600 to-rose-800',
  'from-cyan-600 to-cyan-800',
  'from-indigo-600 to-indigo-800',
  'from-teal-600 to-teal-800',
]

function avatarColor(nome: string) {
  let hash = 0
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function iniciais(nome: string) {
  const parts = nome.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function perfilLabel(p: string) {
  return p === 'ADMINISTRADOR' ? 'Administrador' : 'Analista'
}

function perfilSub(p: string) {
  if (p === 'ADMINISTRADOR') return 'COORDENADOR GERAL'
  return 'ANALISTA JR.'
}

function formatDate(d: Date | null) {
  if (!d) return 'Nunca acessou'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(d: Date | null) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function UsuariosGrid({ usuarios, currentUserId }: Props) {
  const [filtroPerfil,  setFiltroPerfil]  = useState('TODOS')
  const [filtroStatus,  setFiltroStatus]  = useState('TODOS')
  const [busca,         setBusca]         = useState('')
  const [popupId,       setPopupId]       = useState<string | null>(null)
  const [loading,       setLoading]       = useState<string | null>(null)
  const [feedback,      setFeedback]      = useState<{ id: string; msg: string } | null>(null)

  const filtrados = usuarios.filter(u => {
    if (filtroPerfil !== 'TODOS' && u.perfil !== filtroPerfil) return false
    if (filtroStatus !== 'TODOS' && u.status !== filtroStatus) return false
    if (busca) {
      const b = busca.toLowerCase()
      return u.nome.toLowerCase().includes(b) || u.usuario.toLowerCase().includes(b) || u.email.toLowerCase().includes(b)
    }
    return true
  })

  const popup = usuarios.find(u => u.id === popupId)

  async function doAction(id: string, fn: (id: string) => Promise<{ message?: string } | undefined>, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return
    setLoading(id)
    const r = await fn(id)
    setLoading(null)
    if (r?.message) {
      setFeedback({ id, msg: r.message })
      setTimeout(() => setFeedback(null), 4000)
    }
    setPopupId(null)
  }

  return (
    <div className="flex-1 flex flex-col">

      {/* ── Barra de filtros ── */}
      <div className="flex items-center gap-3 px-8 py-3 bg-slate-900/80 border-b border-slate-700/60 flex-wrap">
        {/* PERFIL pills */}
        <div className="flex items-center gap-1">
          {[
            { val: 'TODOS',         label: 'TODOS' },
            { val: 'ADMINISTRADOR', label: 'ADMIN' },
            { val: 'USUARIO',       label: 'ANALISTA' },
          ].map(p => (
            <button
              key={p.val}
              onClick={() => setFiltroPerfil(p.val)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition ${
                filtroPerfil === p.val ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* STATUS */}
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none"
        >
          <option value="TODOS">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Bloqueados</option>
        </select>

        {/* Busca */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 ml-auto">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar usuário..."
            className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-36"
          />
          {busca && <button onClick={() => setBusca('')} className="text-slate-500 hover:text-white text-xs">✕</button>}
        </div>
        <span className="text-xs text-slate-500">{filtrados.length} usuário(s)</span>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 p-8 relative">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtrados.map(u => {
              const isActive  = u.status === 'ATIVO'
              const isMe      = u.id === currentUserId
              const hasPopup  = popupId === u.id
              const isLoading = loading === u.id
              const fb        = feedback?.id === u.id ? feedback.msg : null

              return (
                <div key={u.id} className="relative group">
                  <div
                    onClick={() => setPopupId(hasPopup ? null : u.id)}
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border cursor-pointer transition-all duration-200
                      ${hasPopup ? 'border-blue-500 shadow-lg shadow-blue-900/40' : 'border-slate-700 hover:border-slate-500 hover:shadow-lg'}
                      ${!isActive ? 'opacity-75' : ''}
                    `}
                  >
                    {/* Top glow */}
                    <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white/5 to-transparent" />

                    {/* Status dot */}
                    <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isActive ? 'bg-green-400' : 'bg-red-500'} ${isActive ? 'animate-pulse' : ''}`} />
                    {isMe && (
                      <div className="absolute top-3 left-3 text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">EU</div>
                    )}

                    <div className="p-4 flex flex-col items-center text-center gap-2">
                      {/* Avatar */}
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarColor(u.nome)} flex items-center justify-center text-2xl font-black text-white shadow-lg mt-1`}>
                        {iniciais(u.nome)}
                      </div>

                      {/* Name */}
                      <p className="text-sm font-bold text-white leading-tight line-clamp-2 w-full">{u.nome}</p>

                      {/* Username */}
                      <p className="text-[10px] text-slate-500 font-mono">@{u.usuario}</p>

                      {/* Status badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {isActive ? 'ATIVO' : 'BLOQUEADO'}
                      </span>

                      {/* Perfil */}
                      <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                        {perfilSub(u.perfil)}
                      </p>
                      {u.perfil === 'ADMINISTRADOR' && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">ADM</span>
                      )}

                      {fb && (
                        <p className="text-[10px] text-green-400 font-medium text-center line-clamp-2 mt-1">{fb}</p>
                      )}
                    </div>
                  </div>

                  {/* ── Popup de detalhes ── */}
                  {hasPopup && popup && (
                    <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl shadow-black/60 p-4">
                      {/* Seta */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 border-l border-t border-slate-600 rotate-45" />

                      <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-3">Acesso de Assessor</p>

                      <div className="space-y-2 mb-4">
                        {[
                          { label: 'Nome',         value: popup.nome },
                          { label: 'Usuário',      value: `@${popup.usuario}` },
                          { label: 'E-mail',       value: popup.email },
                          { label: 'Perfil',       value: perfilLabel(popup.perfil) },
                          { label: 'Último acesso',value: popup.ultimo_acesso ? `${formatDate(popup.ultimo_acesso)} às ${formatTime(popup.ultimo_acesso)}` : 'Nunca' },
                          { label: 'Desde',        value: formatDate(popup.data_criacao) },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between gap-2 text-xs">
                            <span className="text-slate-500 shrink-0">{row.label}:</span>
                            <span className="text-white text-right font-medium truncate">{row.value}</span>
                          </div>
                        ))}
                        {popup.primeiro_acesso && (
                          <div className="mt-1 text-[10px] bg-amber-900/40 border border-amber-700/40 text-amber-400 rounded-lg px-2.5 py-1.5 text-center font-semibold">
                            ⚠ Aguardando troca de senha
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="space-y-2">
                        <button
                          onClick={() => setPopupId(null)}
                          className="w-full text-center text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 transition"
                        >
                          Gerenciar Acesso →
                        </button>

                        <div className="grid grid-cols-3 gap-1.5">
                          <Link
                            href={`/dashboard/usuarios/${popup.id}/editar`}
                            className="flex flex-col items-center gap-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition"
                          >
                            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-[9px] text-slate-400">Editar</span>
                          </Link>

                          <button
                            disabled={isLoading}
                            onClick={() => doAction(popup.id, alternarStatusUsuario)}
                            className={`flex flex-col items-center gap-1 py-2 rounded-xl transition ${popup.status === 'ATIVO' ? 'bg-amber-900/40 hover:bg-amber-900/60' : 'bg-green-900/40 hover:bg-green-900/60'} disabled:opacity-50`}
                          >
                            <svg className={`w-3.5 h-3.5 ${popup.status === 'ATIVO' ? 'text-amber-400' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={popup.status === 'ATIVO' ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
                            </svg>
                            <span className={`text-[9px] ${popup.status === 'ATIVO' ? 'text-amber-400' : 'text-green-400'}`}>
                              {popup.status === 'ATIVO' ? 'Bloquear' : 'Ativar'}
                            </span>
                          </button>

                          <button
                            disabled={isLoading}
                            onClick={() => doAction(popup.id, resetarSenha, 'Resetar senha para "Mudar@123"?')}
                            className="flex flex-col items-center gap-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span className="text-[9px] text-slate-400">Senha</span>
                          </button>
                        </div>

                        {popup.id !== currentUserId && (
                          <button
                            disabled={isLoading}
                            onClick={() => doAction(popup.id, excluirUsuario, 'Excluir este usuário? Esta ação não pode ser desfeita.')}
                            className="w-full text-[10px] text-red-500 hover:text-red-400 font-semibold transition py-1 disabled:opacity-50"
                          >
                            Excluir usuário
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Overlay para fechar popup */}
        {popupId && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setPopupId(null)}
          />
        )}
      </div>
    </div>
  )
}
