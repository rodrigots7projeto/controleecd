'use client'
import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Empresa = {
  id: string
  empresa: string
  cnpj: string
  responsavel: string | null
  prioridade: string
  prazo: Date | null
  ecd_status: string
  ecf_status: string
  recibo_ecd: string | null
  recibo_ecf: string | null
}

type Session = { userId: string; nome: string; perfil: string }

type Props = { empresas: Empresa[]; session: Session }

function diasAte(data: Date | null): number | null {
  if (!data) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(data)
  alvo.setHours(0, 0, 0, 0)
  return Math.ceil((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

const CARD_GRADIENTS = [
  { bg: 'from-emerald-900 to-green-700', accent: 'text-green-300', border: 'border-green-600' },
  { bg: 'from-amber-900 to-yellow-700', accent: 'text-amber-300', border: 'border-amber-600' },
  { bg: 'from-red-950 to-red-800', accent: 'text-red-300', border: 'border-red-700' },
  { bg: 'from-slate-800 to-slate-700', accent: 'text-blue-300', border: 'border-slate-600' },
]

export default function PainelGerencial({ empresas, session }: Props) {
  const [statusFiltro, setStatusFiltro] = useState('TODOS')
  const [busca, setBusca] = useState('')

  const stats = useMemo(() => {
    const total = empresas.length
    if (total === 0) return { concluidas: 0, revisao: 0, erros: 0, proxPrazo: null, proxTipo: '' }

    let concluidas = 0, revisao = 0
    for (const e of empresas) {
      const ecdOk = e.ecd_status === 'ENTREGUE' || e.ecd_status === 'DISPENSADA'
      const ecfOk = e.ecf_status === 'ENTREGUE' || e.ecf_status === 'DISPENSADA'
      if (ecdOk && ecfOk) concluidas++
      if (e.ecd_status === 'EM_ANDAMENTO' || e.ecf_status === 'EM_ANDAMENTO') revisao++
    }

    // Erro = entregue sem recibo
    const erros = empresas.filter(e =>
      (e.ecd_status === 'ENTREGUE' && !e.recibo_ecd) ||
      (e.ecf_status === 'ENTREGUE' && !e.recibo_ecf)
    ).length

    // Próximo prazo
    let proxPrazo: number | null = null
    let proxTipo = ''
    for (const e of empresas) {
      const dias = diasAte(e.prazo)
      if (dias !== null && dias >= 0 && (proxPrazo === null || dias < proxPrazo)) {
        proxPrazo = dias
        proxTipo = e.ecd_status !== 'ENTREGUE' ? 'ECD' : 'ECF'
      }
    }

    return { concluidas, pctConcluidas: Math.round((concluidas / total) * 100), revisao, pctRevisao: Math.round((revisao / total) * 100), erros, proxPrazo, proxTipo, total }
  }, [empresas])

  // Dados para o gráfico de pizza
  const pieData = useMemo(() => {
    let entregue = 0, revisao = 0, pendente = 0
    for (const e of empresas) {
      const hasEntregue = e.ecd_status === 'ENTREGUE' || e.ecf_status === 'ENTREGUE'
      const hasRevisao = e.ecd_status === 'EM_ANDAMENTO' || e.ecf_status === 'EM_ANDAMENTO'
      const hasPendente = e.ecd_status === 'PENDENTE' || e.ecf_status === 'PENDENTE'
      if (hasEntregue) entregue++
      if (hasRevisao && !hasEntregue) revisao++
      if (hasPendente && !hasEntregue && !hasRevisao) pendente++
    }
    const total = entregue + revisao + pendente || 1
    return [
      { name: `ENVIADA/RECIBO\n(${Math.round(entregue/total*100)}%)`, value: entregue, color: '#16a34a' },
      { name: `EM REVISÃO/RECIBO PENDENTE\n(${Math.round(revisao/total*100)}%)`, value: revisao, color: '#d97706' },
      { name: `PENDENTE/ERRO/INDISPONÍVEL\n(${Math.round(pendente/total*100)}%)`, value: pendente, color: '#dc2626' },
    ].filter(d => d.value > 0)
  }, [empresas])

  // Dados para o gráfico de barras (por responsável)
  const barData = useMemo(() => {
    const map: Record<string, { enviadas: number; emRevisao: number; pendentes: number }> = {}
    for (const e of empresas) {
      const resp = e.responsavel?.split(' ')[0] || 'Outros'
      if (!map[resp]) map[resp] = { enviadas: 0, emRevisao: 0, pendentes: 0 }
      if (e.ecd_status === 'ENTREGUE' || e.ecf_status === 'ENTREGUE') map[resp].enviadas++
      if (e.ecd_status === 'EM_ANDAMENTO' || e.ecf_status === 'EM_ANDAMENTO') map[resp].emRevisao++
      if (e.ecd_status === 'PENDENTE' || e.ecf_status === 'PENDENTE') map[resp].pendentes++
    }
    return Object.entries(map).slice(0, 6).map(([name, v]) => ({ name, ...v }))
  }, [empresas])

  // Tabela de pendências
  const pendentes = useMemo(() => {
    return empresas
      .filter(e => e.ecd_status === 'PENDENTE' || e.ecf_status === 'PENDENTE' || e.ecd_status === 'EM_ANDAMENTO' || e.ecf_status === 'EM_ANDAMENTO')
      .filter(e => !busca || e.empresa.toLowerCase().includes(busca.toLowerCase()))
      .filter(e => statusFiltro === 'TODOS' || e.ecd_status === statusFiltro || e.ecf_status === statusFiltro)
      .slice(0, 20)
  }, [empresas, busca, statusFiltro])

  return (
    <div className="min-h-screen bg-gray-950 text-white -m-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-wide text-white">
          PAINEL GERENCIAL DE OBRIGAÇÕES (ECD/ECF)
        </h1>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold ring-2 ring-blue-400">
            {session.nome.slice(0, 2).toUpperCase()}
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold">
            AD
          </div>
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold">3</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Concluídas */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${CARD_GRADIENTS[0].bg} p-5 border ${CARD_GRADIENTS[0].border}`}>
          <div className="absolute right-3 top-3 text-4xl opacity-20">🌿</div>
          <p className={`text-4xl font-black ${CARD_GRADIENTS[0].accent}`}>{stats.pctConcluidas ?? 0}%</p>
          <p className="text-white font-bold text-sm mt-1">CONCLUÍDAS</p>
          <p className="text-green-300 text-xs mt-2">Total Empresas: {stats.total}</p>
          <div className="mt-3 h-1.5 bg-green-950 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${stats.pctConcluidas ?? 0}%` }} />
          </div>
        </div>

        {/* Em Revisão */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${CARD_GRADIENTS[1].bg} p-5 border ${CARD_GRADIENTS[1].border}`}>
          <div className="absolute right-3 top-3 text-4xl opacity-20">⚙️</div>
          <p className={`text-4xl font-black ${CARD_GRADIENTS[1].accent}`}>{stats.pctRevisao ?? 0}%</p>
          <p className="text-white font-bold text-sm mt-1">EM REVISÃO</p>
          <p className="text-amber-300 text-xs mt-2">Total Empresas: {stats.revisao}</p>
          <div className="mt-3 h-1.5 bg-amber-950 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${stats.pctRevisao ?? 0}%` }} />
          </div>
        </div>

        {/* Erros */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${CARD_GRADIENTS[2].bg} p-5 border ${CARD_GRADIENTS[2].border}`}>
          <div className="absolute right-3 top-3 text-4xl opacity-20">⚠️</div>
          <div className="flex items-center gap-2">
            <p className="text-4xl font-black text-red-300">{stats.erros}</p>
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <p className="text-white font-bold text-sm mt-1">ERROS DE ENVIO</p>
          <p className="text-red-300 text-xs mt-2">Ação Requerida</p>
        </div>

        {/* Próximo prazo */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${CARD_GRADIENTS[3].bg} p-5 border ${CARD_GRADIENTS[3].border}`}>
          <div className="absolute right-3 top-3 text-4xl opacity-20">🧭</div>
          <p className="text-4xl font-black text-blue-200">
            {stats.proxPrazo !== null ? `${stats.proxPrazo}` : '—'}
            {stats.proxPrazo !== null && <span className="text-xl font-bold"> DIAS</span>}
          </p>
          <p className="text-white font-bold text-sm mt-1">PRÓXIMO PRAZO</p>
          <p className="text-blue-300 text-xs mt-2">{stats.proxTipo || 'Sem prazos'}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-xs font-semibold text-gray-400">STATUS:</span>
        <select
          value={statusFiltro}
          onChange={e => setStatusFiltro(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full outline-none"
        >
          <option value="TODOS">TODOS ▾</option>
          <option value="ENTREGUE">ENVIADA</option>
          <option value="EM_ANDAMENTO">EM REVISÃO</option>
          <option value="PENDENTE">PENDENTE</option>
          <option value="DISPENSADA">DISPENSADA</option>
        </select>
        <span className="text-xs font-semibold text-gray-400">ANO:</span>
        <span className="bg-gray-800 border border-gray-700 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-full">
          {new Date().getFullYear()} ▾
        </span>
        <div className="ml-auto flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-4 py-1.5">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            placeholder="Search..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-gray-500 outline-none w-36"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Pie Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-200 mb-4 tracking-wide">
            DISTRIBUIÇÃO DE STATUS GLOBAL (ECD + ECF)
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-gray-300 leading-tight whitespace-pre-line">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-200 mb-4 tracking-wide">
            DESEMPENHO POR RESPONSÁVEL
          </h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                <Bar dataKey="enviadas" name="Enviadas" fill="#16a34a" radius={[3,3,0,0]} />
                <Bar dataKey="emRevisao" name="Em Revisão" fill="#d97706" radius={[3,3,0,0]} />
                <Bar dataKey="pendentes" name="Pendentes" fill="#6b7280" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-600 text-sm">
              Sem dados para exibir
            </div>
          )}
        </div>
      </div>

      {/* Tabela de pendências */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="text-sm font-bold text-gray-200 tracking-wide">DETALHES DE OBRIGAÇÕES PENDENTES</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">EMPRESA ↕</th>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">CNPJ</th>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">TIPO (ECD/ECF)</th>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">STATUS ↕</th>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">DATA LIMITE ↕</th>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">AÇÃO REQUERIDA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {pendentes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-600">
                    Nenhuma obrigação pendente
                  </td>
                </tr>
              ) : (
                pendentes.map((e) => {
                  const tipo = e.ecd_status !== 'ENTREGUE' && e.ecd_status !== 'DISPENSADA' ? 'ECD'
                    : e.ecf_status !== 'ENTREGUE' && e.ecf_status !== 'DISPENSADA' ? 'ECF' : 'ECD/ECF'
                  const status = tipo === 'ECD' ? e.ecd_status : e.ecf_status
                  const dias = diasAte(e.prazo)

                  const acao = status === 'EM_ANDAMENTO' ? 'Revalidar' : status === 'PENDENTE' ? 'Reenviar' : 'Verificar'

                  return (
                    <tr key={e.id} className="hover:bg-gray-800/40 transition">
                      <td className="px-4 py-3 text-white font-medium">{e.empresa}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono">{e.cnpj}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tipo === 'ECD' ? 'bg-blue-900 text-blue-300' : tipo === 'ECF' ? 'bg-purple-900 text-purple-300' : 'bg-gray-700 text-gray-300'}`}>
                          {tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {status === 'PENDENTE' && (
                          <span className="flex items-center gap-1 text-gray-300">
                            <span className="text-yellow-500">⊙</span> Pendente
                          </span>
                        )}
                        {status === 'EM_ANDAMENTO' && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <span className="text-red-500">▲</span> Erro de Envio
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {dias !== null ? (
                          <span className={dias <= 5 ? 'text-red-400 font-bold' : dias <= 15 ? 'text-amber-400' : 'text-gray-300'}>
                            {dias <= 0 ? 'VENCIDO' : `${dias} DIAS`}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-blue-400 font-medium">{acao}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
