'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { excluirEmpresas } from '@/app/actions/empresas'

type Empresa = {
  id: string
  empresa: string
  cnpj: string
  grupo: string | null
  responsavel: string | null
  ecd_status: string
  ecf_status: string
  situacao_empresa: string
  prioridade: string
}

type Props = { empresas: Empresa[] }

const POR_PAG = 100

const statusColors: Record<string, string> = {
  PENDENTE:           'bg-yellow-100 text-yellow-700',
  EM_ANDAMENTO:       'bg-blue-100 text-blue-700',
  ENTREGUE:           'bg-green-100 text-green-700',
  DISPENSADA:         'bg-gray-100 text-gray-600',
  ENTREGUE_RETIFICAR: 'bg-blue-100 text-blue-700',
  RETIFICADO_OK:      'bg-emerald-100 text-emerald-700',
}
const statusLabel: Record<string, string> = {
  PENDENTE:           'Pendente',
  EM_ANDAMENTO:       'Em Andamento',
  ENTREGUE:           'Entregue',
  DISPENSADA:         'Dispensada',
  ENTREGUE_RETIFICAR: 'Retificar',
  RETIFICADO_OK:      'Retificado ✓',
}

export default function EmpresasLista({ empresas: inicial }: Props) {
  const [empresas,     setEmpresas]     = useState(inicial)
  const [modoExcluir,  setModoExcluir]  = useState(false)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [confirmando,  setConfirmando]  = useState<'bulk' | string | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [busca,        setBusca]        = useState('')
  const [pagina,       setPagina]       = useState(1)

  // reset página quando busca muda
  useEffect(() => { setPagina(1) }, [busca])

  function sairModoExcluir() {
    setModoExcluir(false)
    setSelecionados(new Set())
  }

  const filtradas = empresas.filter(e =>
    !busca ||
    e.empresa.toLowerCase().includes(busca.toLowerCase()) ||
    e.cnpj.includes(busca) ||
    (e.responsavel ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  const totalPags  = Math.max(1, Math.ceil(filtradas.length / POR_PAG))
  const paginadas  = filtradas.slice((pagina - 1) * POR_PAG, pagina * POR_PAG)

  const todosSelec = paginadas.length > 0 && paginadas.every(e => selecionados.has(e.id))
  const algumSelec = paginadas.some(e => selecionados.has(e.id))

  function toggleTodos() {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (todosSelec) {
        paginadas.forEach(e => next.delete(e.id))
      } else {
        paginadas.forEach(e => next.add(e.id))
      }
      return next
    })
  }

  function toggleUm(id: string) {
    setSelecionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function deletar(ids: string[]) {
    setLoading(true)
    const r = await excluirEmpresas(ids)
    setLoading(false)
    setConfirmando(null)
    if (r.ok) {
      setEmpresas(prev => prev.filter(e => !ids.includes(e.id)))
      sairModoExcluir()
      if (pagina > Math.max(1, Math.ceil((filtradas.length - ids.length) / POR_PAG))) {
        setPagina(p => Math.max(1, p - 1))
      }
    }
  }

  const idsParaDeletar = confirmando === 'bulk'
    ? [...selecionados]
    : confirmando
      ? [confirmando]
      : []

  // Números de página para exibir (máx 7 botões)
  function paginasVisiveis(): number[] {
    if (totalPags <= 7) return Array.from({ length: totalPags }, (_, i) => i + 1)
    const pages: number[] = []
    pages.push(1)
    if (pagina > 3) pages.push(-1) // ellipsis
    for (let p = Math.max(2, pagina - 1); p <= Math.min(totalPags - 1, pagina + 1); p++) pages.push(p)
    if (pagina < totalPags - 2) pages.push(-2) // ellipsis
    pages.push(totalPags)
    return pages
  }

  return (
    <>
      {/* ── Barra de busca + ações ── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white flex-1 min-w-[200px]">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar empresa, CNPJ ou responsável..."
            className="text-sm text-gray-700 bg-transparent outline-none w-full placeholder-gray-400"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>

        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          {filtradas.length} empresa(s)
          {totalPags > 1 && ` · pág. ${pagina}/${totalPags}`}
        </span>

        {!modoExcluir ? (
          <button
            onClick={() => setModoExcluir(true)}
            className="flex items-center gap-1.5 border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-bold px-4 py-2 rounded-lg transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Excluir
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <span className="text-sm font-semibold text-red-700">
              {selecionados.size > 0 ? `${selecionados.size} selecionada(s)` : 'Selecione as empresas'}
            </span>
            {selecionados.size > 0 && (
              <button
                onClick={() => setConfirmando('bulk')}
                disabled={loading}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Excluir selecionadas
              </button>
            )}
            <button
              onClick={sairModoExcluir}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium border border-gray-200 bg-white px-3 py-1.5 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* ── Tabela ── */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {modoExcluir && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={todosSelec}
                      ref={el => { if (el) el.indeterminate = algumSelec && !todosSelec }}
                      onChange={toggleTodos}
                      title="Selecionar todos desta página"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </th>
                )}
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Empresa</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">CNPJ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Grupo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Responsável</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ECD</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ECF</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Situação</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Prioridade</th>
                {modoExcluir && <th className="px-4 py-3 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginadas.length === 0 ? (
                <tr>
                  <td colSpan={modoExcluir ? 10 : 8} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                      </svg>
                      <p>Nenhuma empresa encontrada.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginadas.map(e => {
                  const selec = selecionados.has(e.id)
                  return (
                    <tr key={e.id} className={`hover:bg-blue-50 transition group ${selec ? 'bg-red-50' : ''}`}>
                      {modoExcluir && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selec}
                            onChange={() => toggleUm(e.id)}
                            className="w-4 h-4 rounded border-gray-300 text-red-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/empresas/${e.id}`}
                          className="flex items-center gap-2 font-semibold text-gray-800 hover:text-blue-700 transition"
                        >
                          {e.empresa}
                          <svg className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {e.cnpj.startsWith('PENDENTE-')
                          ? <span className="text-amber-500 font-semibold">— pendente —</span>
                          : <span className="text-gray-600">{e.cnpj}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-600">{e.grupo ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{e.responsavel ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[e.ecd_status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {statusLabel[e.ecd_status] ?? e.ecd_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[e.ecf_status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {statusLabel[e.ecf_status] ?? e.ecf_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${e.situacao_empresa === 'ATIVA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {e.situacao_empresa}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${
                          e.prioridade === 'URGENTE' ? 'text-red-600'
                          : e.prioridade === 'ALTA'  ? 'text-orange-500'
                          : e.prioridade === 'MEDIA' ? 'text-yellow-600'
                          : 'text-gray-500'
                        }`}>
                          {e.prioridade}
                        </span>
                      </td>
                      {modoExcluir && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setConfirmando(e.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Excluir empresa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginação ── */}
        {totalPags > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Mostrando {(pagina - 1) * POR_PAG + 1}–{Math.min(pagina * POR_PAG, filtradas.length)} de {filtradas.length} empresa(s)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina(1)}
                disabled={pagina === 1}
                className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Primeira página"
              >
                «
              </button>
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ‹ Anterior
              </button>

              {paginasVisiveis().map((p, i) =>
                p < 0 ? (
                  <span key={`el${i}`} className="px-1 text-gray-400 text-xs">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPagina(p)}
                    className={`w-8 h-7 text-xs rounded border transition font-medium ${
                      pagina === p
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPagina(p => Math.min(totalPags, p + 1))}
                disabled={pagina === totalPags}
                className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Próxima ›
              </button>
              <button
                onClick={() => setPagina(totalPags)}
                disabled={pagina === totalPags}
                className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Última página"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal de confirmação ── */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmando(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {confirmando === 'bulk'
                ? `Tem certeza que deseja excluir ${selecionados.size} empresa(s)? Esta ação não pode ser desfeita.`
                : `Tem certeza que deseja excluir "${empresas.find(e => e.id === confirmando)?.empresa}"? Esta ação não pode ser desfeita.`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deletar(idsParaDeletar)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2.5 rounded-xl text-sm transition"
              >
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Excluindo...</>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Sim, excluir
                  </>
                )}
              </button>
              <button
                onClick={() => setConfirmando(null)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
