import { Metadata } from 'next'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Empresas | Controle ECD/ECF' }

const statusColors: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
  ENTREGUE: 'bg-green-100 text-green-700',
  DISPENSADA: 'bg-gray-100 text-gray-600',
}

const statusLabel: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em Andamento',
  ENTREGUE: 'Entregue',
  DISPENSADA: 'Dispensada',
}

export default async function EmpresasPage() {
  await verifySession()

  const empresas = await prisma.empresa.findMany({
    orderBy: [{ prioridade: 'desc' }, { empresa: 'asc' }],
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Empresas</h1>
          <p className="text-gray-500 text-sm mt-1">{empresas.length} empresa(s) cadastrada(s)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Empresa</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">CNPJ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Grupo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Responsável</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ECD</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ECF</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Situação</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Prioridade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {empresas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                      </svg>
                      <p>Nenhuma empresa cadastrada.</p>
                      <p className="text-xs">Importe uma planilha ou cadastre manualmente.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                empresas.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{e.empresa}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{e.cnpj}</td>
                    <td className="px-4 py-3 text-gray-600">{e.grupo ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{e.responsavel ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[e.ecd_status]}`}>
                        {statusLabel[e.ecd_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[e.ecf_status]}`}>
                        {statusLabel[e.ecf_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${e.situacao_empresa === 'ATIVA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {e.situacao_empresa}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${e.prioridade === 'URGENTE' ? 'text-red-600' : e.prioridade === 'ALTA' ? 'text-orange-500' : e.prioridade === 'MEDIA' ? 'text-yellow-600' : 'text-gray-500'}`}>
                        {e.prioridade}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
