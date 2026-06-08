import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { temPermissao } from '@/lib/permissoes'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Controle de Obrigações | Controle ECD/ECF' }

function calcDias(mes: number, dia: number) {
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const alvo = new Date(hoje.getFullYear(), mes - 1, dia)
  if (hoje > alvo) alvo.setFullYear(alvo.getFullYear() + 1)
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86400000)
}

function alertaCor(dias: number) {
  if (dias <= 0)  return { borda: 'border-red-700',    texto: 'text-red-400',    bg: 'bg-red-950',    status: 'VENCIDO',  pulsa: true  }
  if (dias <= 7)  return { borda: 'border-red-700',    texto: 'text-red-300',    bg: 'bg-red-950',    status: 'CRÍTICO',  pulsa: true  }
  if (dias <= 15) return { borda: 'border-orange-700', texto: 'text-orange-300', bg: 'bg-orange-950', status: 'URGENTE',  pulsa: false }
  if (dias <= 30) return { borda: 'border-amber-700',  texto: 'text-amber-300',  bg: 'bg-amber-950',  status: 'ATENÇÃO',  pulsa: false }
  return             { borda: 'border-green-800',  texto: 'text-green-300',  bg: 'bg-green-950',  status: 'NO PRAZO', pulsa: false }
}

export default async function ObrigacoesPage() {
  const session = await verifySession()
  if (!temPermissao(session, 'obrigacoes')) redirect('/dashboard')

  const [totalEmpresas, ecdPendentes, ecfPendentes, ecdEntregues, ecfEntregues] = await Promise.all([
    prisma.empresa.count({ where: { situacao_empresa: { in: ['ATIVA', 'SUSPENSA'] } } }),
    prisma.empresa.count({ where: { situacao_empresa: { in: ['ATIVA', 'SUSPENSA'] }, ecd_status: 'PENDENTE' } }),
    prisma.empresa.count({ where: { situacao_empresa: { in: ['ATIVA', 'SUSPENSA'] }, ecf_status: 'PENDENTE' } }),
    prisma.empresa.count({ where: { situacao_empresa: { in: ['ATIVA', 'SUSPENSA'] }, ecd_status: 'ENTREGUE' } }),
    prisma.empresa.count({ where: { situacao_empresa: { in: ['ATIVA', 'SUSPENSA'] }, ecf_status: 'ENTREGUE' } }),
  ])

  const ecdPct = totalEmpresas > 0 ? Math.round((ecdEntregues / totalEmpresas) * 100) : 0
  const ecfPct = totalEmpresas > 0 ? Math.round((ecfEntregues / totalEmpresas) * 100) : 0

  const ecdDias = calcDias(6, 30)
  const ecfDias = calcDias(7, 31)
  const ecdAlerta = alertaCor(ecdDias)
  const ecfAlerta = alertaCor(ecfDias)

  return (
    <div className="min-h-full bg-gray-950 p-8 flex flex-col">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black tracking-widest text-white uppercase">
          Controle de Obrigações
        </h1>
        <p className="text-gray-400 mt-2 text-sm">Selecione a obrigação que deseja gerenciar</p>
      </div>

      {/* Cards de seleção */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        {/* ECD */}
        <Link
          href="/dashboard/obrigacoes/ecd"
          className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-900/30"
        >
          {/* Background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-amber-950 to-yellow-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.15),_transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Glow border on hover */}
          <div className="absolute inset-0 rounded-3xl ring-2 ring-transparent group-hover:ring-amber-500/60 transition-all duration-300" />

          {/* Decorative elements */}
          <div className="absolute top-6 right-6 text-7xl opacity-15 group-hover:opacity-25 transition-opacity duration-300">📚</div>
          <div className="absolute -bottom-4 -right-4 w-40 h-40 bg-amber-600/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500" />

          {/* Content */}
          <div className="relative p-10 flex flex-col h-72">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-7xl font-black text-white tracking-tight leading-none drop-shadow-2xl">ECD</p>
                  <p className="text-amber-300 text-base font-medium mt-2">Escrituração Contábil Digital</p>
                </div>
                {/* Badge de prazo */}
                <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${ecdAlerta.borda} ${ecdAlerta.bg} ${ecdAlerta.pulsa ? 'animate-pulse' : ''}`}>
                  <span className={`text-2xl font-black leading-none ${ecdAlerta.texto}`}>{ecdDias <= 0 ? '0' : ecdDias}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${ecdAlerta.texto}`}>{ecdDias === 1 ? 'dia' : 'dias'}</span>
                  <span className="text-[8px] text-gray-400 mt-0.5">30/06</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progresso</span>
                <span className="text-amber-300 font-bold">{ecdPct}%</span>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-700"
                  style={{ width: `${ecdPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 pt-1">
                <span className="text-green-400 font-semibold">✓ {ecdEntregues} entregues</span>
                <span className="text-amber-400">{ecdPendentes} pendentes</span>
                <span>{totalEmpresas} total</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-5 flex items-center gap-2 text-amber-300 text-sm font-semibold group-hover:gap-4 transition-all duration-300">
              <span>Abrir controle ECD</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </Link>

        {/* ECF */}
        <Link
          href="/dashboard/obrigacoes/ecf"
          className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-900/30"
        >
          {/* Background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.2),_transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Glow border on hover */}
          <div className="absolute inset-0 rounded-3xl ring-2 ring-transparent group-hover:ring-blue-500/60 transition-all duration-300" />
          {/* Red accent dot (like in the reference image) */}
          <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-pulse" />

          {/* Decorative elements */}
          <div className="absolute top-6 right-10 text-7xl opacity-15 group-hover:opacity-25 transition-opacity duration-300">⚙️</div>
          <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />

          {/* Content */}
          <div className="relative p-10 flex flex-col h-72">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-7xl font-black text-white tracking-tight leading-none drop-shadow-2xl">ECF</p>
                  <p className="text-blue-300 text-base font-medium mt-2">Escrituração Contábil Fiscal</p>
                </div>
                {/* Badge de prazo */}
                <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${ecfAlerta.borda} ${ecfAlerta.bg} ${ecfAlerta.pulsa ? 'animate-pulse' : ''}`}>
                  <span className={`text-2xl font-black leading-none ${ecfAlerta.texto}`}>{ecfDias <= 0 ? '0' : ecfDias}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${ecfAlerta.texto}`}>{ecfDias === 1 ? 'dia' : 'dias'}</span>
                  <span className="text-[8px] text-gray-400 mt-0.5">31/07</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progresso</span>
                <span className="text-blue-300 font-bold">{ecfPct}%</span>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full transition-all duration-700"
                  style={{ width: `${ecfPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 pt-1">
                <span className="text-green-400 font-semibold">✓ {ecfEntregues} entregues</span>
                <span className="text-blue-400">{ecfPendentes} pendentes</span>
                <span>{totalEmpresas} total</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-5 flex items-center gap-2 text-blue-300 text-sm font-semibold group-hover:gap-4 transition-all duration-300">
              <span>Abrir controle ECF</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Rodapé */}
      <p className="text-center text-gray-700 text-xs mt-8">
        {totalEmpresas} empresas ativas no sistema
      </p>
    </div>
  )
}
