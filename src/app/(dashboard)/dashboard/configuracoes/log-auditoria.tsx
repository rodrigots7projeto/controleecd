'use client'
import { Fragment, useState, useMemo } from 'react'
import type { LogEntry } from './page'

const OPERACAO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  INSERT:  { label: 'INSERÇÃO',  bg: 'bg-green-100',  text: 'text-green-700' },
  UPDATE:  { label: 'ALTERAÇÃO', bg: 'bg-amber-100',  text: 'text-amber-700' },
  DELETE:  { label: 'EXCLUSÃO',  bg: 'bg-red-100',    text: 'text-red-700'   },
  LOGIN:   { label: 'LOGIN',     bg: 'bg-blue-100',   text: 'text-blue-700'  },
  LOGOUT:  { label: 'LOGOUT',   bg: 'bg-slate-100',  text: 'text-slate-700' },
  IMPORT:  { label: 'IMPORTAÇÃO',bg: 'bg-purple-100', text: 'text-purple-700'},
  EXPORT:  { label: 'EXPORTAÇÃO',bg: 'bg-indigo-100', text: 'text-indigo-700'},
  RESET:   { label: 'RESET',     bg: 'bg-orange-100', text: 'text-orange-700'},
}

function opCfg(op: string) {
  return OPERACAO_CONFIG[op.toUpperCase()] ?? { label: op, bg: 'bg-gray-100', text: 'text-gray-700' }
}

function tabelaLabel(t: string) {
  const map: Record<string, string> = {
    usuarios: 'Usuários', empresas: 'Empresas', auditorias: 'Auditoria',
    obrigacoes: 'Obrigações', usuarios_empresas: 'Usuários/Empresas',
  }
  return map[t] ?? t
}

type Props = { logs: LogEntry[]; totalLogs: number }

export default function LogAuditoria({ logs, totalLogs }: Props) {
  const [busca, setBusca]         = useState('')
  const [filtroOp, setFiltroOp]   = useState('TODAS')
  const [filtroTab, setFiltroTab] = useState('TODAS')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [pagina, setPagina]       = useState(1)
  const POR_PAG = 25

  const operacoes = useMemo(
    () => ['TODAS', ...Array.from(new Set(logs.map(l => l.operacao.toUpperCase()))).sort()],
    [logs]
  )
  const tabelas = useMemo(
    () => ['TODAS', ...Array.from(new Set(logs.map(l => l.tabela))).sort()],
    [logs]
  )

  const filtrados = useMemo(() => {
    return logs.filter(l => {
      if (filtroOp  !== 'TODAS' && l.operacao.toUpperCase() !== filtroOp)  return false
      if (filtroTab !== 'TODAS' && l.tabela !== filtroTab)                  return false
      if (busca) {
        const b = busca.toLowerCase()
        const match =
          l.descricao?.toLowerCase().includes(b) ||
          l.usuario?.nome.toLowerCase().includes(b) ||
          l.usuario?.usuario.toLowerCase().includes(b) ||
          l.empresa?.empresa.toLowerCase().includes(b) ||
          l.registro_id.toLowerCase().includes(b) ||
          l.campo?.toLowerCase().includes(b) ||
          l.valor_antes?.toLowerCase().includes(b) ||
          l.valor_depois?.toLowerCase().includes(b)
        if (!match) return false
      }
      return true
    })
  }, [logs, filtroOp, filtroTab, busca])

  const totalPags = Math.max(1, Math.ceil(filtrados.length / POR_PAG))
  const paginados = filtrados.slice((pagina - 1) * POR_PAG, pagina * POR_PAG)

  function resetPagina() { setPagina(1) }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de registros', value: totalLogs,                    color: 'text-gray-800' },
          { label: 'Últimos 200',        value: logs.length,                  color: 'text-blue-700' },
          { label: 'Filtrados',          value: filtrados.length,             color: 'text-indigo-700' },
          { label: 'Esta página',        value: paginados.length,             color: 'text-slate-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
        {/* Busca */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Buscar</label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={busca}
              onChange={e => { setBusca(e.target.value); resetPagina() }}
              placeholder="Usuário, empresa, campo, valor..."
              className="text-sm text-gray-700 bg-transparent outline-none w-full placeholder-gray-400"
            />
            {busca && (
              <button onClick={() => { setBusca(''); resetPagina() }} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>
        </div>

        {/* Operação */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Operação</label>
          <select
            value={filtroOp}
            onChange={e => { setFiltroOp(e.target.value); resetPagina() }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 outline-none"
          >
            {operacoes.map(o => (
              <option key={o} value={o}>{o === 'TODAS' ? 'Todas as operações' : opCfg(o).label}</option>
            ))}
          </select>
        </div>

        {/* Tabela */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Módulo</label>
          <select
            value={filtroTab}
            onChange={e => { setFiltroTab(e.target.value); resetPagina() }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 outline-none"
          >
            {tabelas.map(t => (
              <option key={t} value={t}>{t === 'TODAS' ? 'Todos os módulos' : tabelaLabel(t)}</option>
            ))}
          </select>
        </div>

        {(filtroOp !== 'TODAS' || filtroTab !== 'TODAS' || busca) && (
          <button
            onClick={() => { setBusca(''); setFiltroOp('TODAS'); setFiltroTab('TODAS'); resetPagina() }}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold py-2 px-3 rounded-lg border border-blue-200 hover:border-blue-400 transition"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Data / Hora</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Usuário</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Operação</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Módulo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Empresa</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Descrição</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                paginados.map(log => {
                  const cfg = opCfg(log.operacao)
                  const temDetalhes = log.campo || log.valor_antes || log.valor_depois
                  const isOpen = expandido === log.id

                  return (
                    <Fragment key={log.id}>
                      <tr className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap font-mono">
                          {new Date(log.data).toLocaleDateString('pt-BR')}
                          <span className="block text-gray-400">
                            {new Date(log.data).toLocaleTimeString('pt-BR')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {log.usuario ? (
                            <div>
                              <p className="font-medium text-gray-800 text-xs">{log.usuario.nome}</p>
                              <p className="text-gray-400 text-[11px]">@{log.usuario.usuario}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Sistema</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs font-medium">
                          {tabelaLabel(log.tabela)}
                        </td>
                        <td className="px-4 py-3">
                          {log.empresa ? (
                            <div>
                              <p className="text-gray-700 text-xs font-medium truncate max-w-[140px]" title={log.empresa.empresa}>
                                {log.empresa.empresa}
                              </p>
                              <p className="text-gray-400 text-[11px] font-mono">{log.empresa.cnpj}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px]">
                          <span className="line-clamp-2" title={log.descricao ?? undefined}>{log.descricao || '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {temDetalhes ? (
                            <button
                              onClick={() => setExpandido(isOpen ? null : log.id)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-semibold transition"
                            >
                              {isOpen ? '▲ Fechar' : '▼ Ver'}
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>

                      {isOpen && temDetalhes && (
                        <tr className="bg-blue-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="text-xs space-y-2">
                              {log.campo && (
                                <div className="flex gap-2 items-baseline">
                                  <span className="font-semibold text-gray-600 w-20 shrink-0">Campo:</span>
                                  <span className="text-gray-800 font-mono bg-white border border-gray-200 px-2 py-0.5 rounded">{log.campo}</span>
                                </div>
                              )}
                              {log.valor_antes !== null && (
                                <div className="flex gap-2 items-baseline">
                                  <span className="font-semibold text-gray-600 w-20 shrink-0">Antes:</span>
                                  <span className="text-red-700 font-mono bg-red-50 border border-red-100 px-2 py-0.5 rounded break-all">{log.valor_antes || '(vazio)'}</span>
                                </div>
                              )}
                              {log.valor_depois !== null && (
                                <div className="flex gap-2 items-baseline">
                                  <span className="font-semibold text-gray-600 w-20 shrink-0">Depois:</span>
                                  <span className="text-green-700 font-mono bg-green-50 border border-green-100 px-2 py-0.5 rounded break-all">{log.valor_depois || '(vazio)'}</span>
                                </div>
                              )}
                              <div className="flex gap-2 items-baseline">
                                <span className="font-semibold text-gray-600 w-20 shrink-0">ID Reg.:</span>
                                <span className="text-gray-500 font-mono">{log.registro_id}</span>
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Mostrando {(pagina - 1) * POR_PAG + 1}–{Math.min(pagina * POR_PAG, filtrados.length)} de {filtrados.length} registros
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Anterior
              </button>

              {Array.from({ length: Math.min(5, totalPags) }, (_, i) => {
                let page = i + 1
                if (totalPags > 5) {
                  if (pagina <= 3) page = i + 1
                  else if (pagina >= totalPags - 2) page = totalPags - 4 + i
                  else page = pagina - 2 + i
                }
                return (
                  <button
                    key={page}
                    onClick={() => setPagina(page)}
                    className={`w-8 h-8 text-xs rounded-lg border transition ${
                      pagina === page
                        ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                        : 'border-gray-200 text-gray-600 hover:bg-white'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}

              <button
                onClick={() => setPagina(p => Math.min(totalPags, p + 1))}
                disabled={pagina === totalPags}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
