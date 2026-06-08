import { Metadata } from 'next'
import Link from 'next/link'
import { verifyAdmin } from '@/lib/dal'
import ImportadorEmpresas from './importador'

export const metadata: Metadata = { title: 'Importar Empresas | Controle ECD/ECF' }

export default async function ImportarEmpresasPage() {
  await verifyAdmin()
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/empresas" className="text-gray-500 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Importar Empresas</h1>
          <p className="text-gray-500 text-sm">Importe empresas de uma planilha Excel (.xlsx) ou CSV (.csv)</p>
        </div>
      </div>
      <ImportadorEmpresas />
    </div>
  )
}
