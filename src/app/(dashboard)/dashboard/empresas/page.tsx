import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { temPermissao } from '@/lib/permissoes'
import { prisma } from '@/lib/prisma'
import EmpresasLista from './empresas-lista'

export const metadata: Metadata = { title: 'Empresas | Controle ECD/ECF' }

export default async function EmpresasPage() {
  const session = await verifySession()
  if (!temPermissao(session, 'empresas')) redirect('/dashboard')

  const empresas = await prisma.empresa.findMany({
    orderBy: [{ prioridade: 'desc' }, { empresa: 'asc' }],
    select: {
      id: true,
      empresa: true,
      cnpj: true,
      grupo: true,
      responsavel: true,
      ecd_status: true,
      ecf_status: true,
      situacao_empresa: true,
      prioridade: true,
    },
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Empresas</h1>
          <p className="text-gray-500 text-sm mt-1">{empresas.length} empresa(s) cadastrada(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/modelo-importacao"
            download
            className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition bg-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar Modelo
          </a>
          <a
            href="/dashboard/empresas/importar"
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Importar Planilha
          </a>
        </div>
      </div>

      <EmpresasLista empresas={empresas} />
    </div>
  )
}
