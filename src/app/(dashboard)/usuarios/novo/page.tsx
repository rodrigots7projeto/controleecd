import { Metadata } from 'next'
import Link from 'next/link'
import { verifyAdmin } from '@/lib/dal'
import UsuarioForm from '../usuario-form'

export const metadata: Metadata = { title: 'Novo Usuário | Controle ECD/ECF' }

export default async function NovoUsuarioPage() {
  await verifyAdmin()
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/usuarios" className="text-gray-500 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Novo Usuário</h1>
          <p className="text-gray-500 text-sm">Preencha os dados do novo usuário</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <UsuarioForm />
      </div>
    </div>
  )
}
