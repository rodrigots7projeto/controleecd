import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import UsuarioForm from '../../usuario-form'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Editar Usuário | Controle ECD/ECF' }

export default async function EditarUsuarioPage({ params }: Props) {
  await verifyAdmin()
  const { id } = await params

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true, usuario: true, perfil: true, status: true, permissoes: true },
  })

  if (!usuario) notFound()

  return (
    <div className="min-h-full bg-gray-950 text-white flex flex-col">
      <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 border-b border-slate-700 px-8 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/usuarios"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-slate-400 uppercase">Usuários</p>
            <h1 className="text-xl font-black text-white">Editar: {usuario.nome}</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-xl bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <UsuarioForm usuario={usuario} />
        </div>
      </div>
    </div>
  )
}
