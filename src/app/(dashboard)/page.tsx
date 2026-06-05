import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard | Controle ECD/ECF' }

export default async function DashboardPage() {
  const session = await verifySession()

  const [totalEmpresas, totalUsuarios, ecdPendentes, ecfPendentes] = await Promise.all([
    prisma.empresa.count(),
    session.perfil === 'ADMINISTRADOR' ? prisma.usuario.count() : null,
    prisma.empresa.count({ where: { ecd_status: 'PENDENTE', situacao_empresa: 'ATIVA' } }),
    prisma.empresa.count({ where: { ecf_status: 'PENDENTE', situacao_empresa: 'ATIVA' } }),
  ])

  const cards = [
    { titulo: 'Total de Empresas', valor: totalEmpresas, cor: 'bg-blue-600', icon: '🏢' },
    { titulo: 'ECD Pendentes', valor: ecdPendentes, cor: 'bg-amber-500', icon: '📋' },
    { titulo: 'ECF Pendentes', valor: ecfPendentes, cor: 'bg-red-500', icon: '📊' },
    ...(session.perfil === 'ADMINISTRADOR'
      ? [{ titulo: 'Usuários', valor: totalUsuarios ?? 0, cor: 'bg-green-600', icon: '👥' }]
      : []),
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bem-vindo, <span className="font-medium text-blue-700">{session.nome}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.titulo} className={`${card.cor} rounded-xl p-6 text-white shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{card.titulo}</p>
                <p className="text-3xl font-bold mt-1">{card.valor}</p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a href="/dashboard/empresas" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition group">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
              <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">Empresas</p>
              <p className="text-xs text-gray-500">Gerenciar ECD e ECF</p>
            </div>
          </a>

          {session.perfil === 'ADMINISTRADOR' && (
            <a href="/dashboard/usuarios" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition group">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Usuários</p>
                <p className="text-xs text-gray-500">Gerenciar acessos</p>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
