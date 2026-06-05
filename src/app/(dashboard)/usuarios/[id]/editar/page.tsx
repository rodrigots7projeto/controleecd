import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import UsuarioForm from '../../usuario-form'

export const metadata: Metadata = { title: 'Editar Usuário | Controle ECD/ECF' }

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  await verifyAdmin()
  const { id } = await params

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true, usuario: true, perfil: true, status: true },
  })
  if (!usuario) notFound()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/usuarios" className="text-gray-500 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Editar Usuário</h1>
          <p className="text-gray-500 text-sm">{usuario.nome}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <UsuarioForm usuario={usuario} />
      </div>
    </div>
  )
}
