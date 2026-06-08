import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import EmpresaForm from './empresa-form'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const empresa = await prisma.empresa.findUnique({ where: { id }, select: { empresa: true } })
  return { title: `${empresa?.empresa ?? 'Empresa'} | Controle ECD/ECF` }
}

export default async function EmpresaPage({ params }: Props) {
  await verifySession()
  const { id } = await params

  const empresa = await prisma.empresa.findUnique({ where: { id } })
  if (!empresa) notFound()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/empresas"
          className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition shrink-0"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Cadastro da Empresa</p>
          <h1 className="text-2xl font-bold text-gray-800 truncate">{empresa.empresa}</h1>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400">Última atualização</p>
          <p className="text-sm text-gray-600 font-medium">
            {new Date(empresa.data_atualizacao).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Status rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'Situação',
            value: empresa.situacao_empresa,
            color: empresa.situacao_empresa === 'ATIVA'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700',
          },
          {
            label: 'Prioridade',
            value: empresa.prioridade,
            color: empresa.prioridade === 'URGENTE' ? 'bg-red-50 border-red-200 text-red-700'
              : empresa.prioridade === 'ALTA'    ? 'bg-orange-50 border-orange-200 text-orange-700'
              : empresa.prioridade === 'MEDIA'   ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'bg-gray-50 border-gray-200 text-gray-600',
          },
          {
            label: 'Status ECD',
            value: empresa.ecd_status,
            color: empresa.ecd_status === 'ENTREGUE'     ? 'bg-green-50 border-green-200 text-green-700'
              : empresa.ecd_status === 'EM_ANDAMENTO' ? 'bg-blue-50 border-blue-200 text-blue-700'
              : empresa.ecd_status === 'DISPENSADA'   ? 'bg-gray-50 border-gray-200 text-gray-500'
              : 'bg-yellow-50 border-yellow-200 text-yellow-700',
          },
          {
            label: 'Status ECF',
            value: empresa.ecf_status,
            color: empresa.ecf_status === 'ENTREGUE'     ? 'bg-green-50 border-green-200 text-green-700'
              : empresa.ecf_status === 'EM_ANDAMENTO' ? 'bg-blue-50 border-blue-200 text-blue-700'
              : empresa.ecf_status === 'DISPENSADA'   ? 'bg-gray-50 border-gray-200 text-gray-500'
              : 'bg-yellow-50 border-yellow-200 text-yellow-700',
          },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-0.5">{s.label}</p>
            <p className="text-sm font-bold">{s.value.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <EmpresaForm empresa={empresa} />
      </div>
    </div>
  )
}
