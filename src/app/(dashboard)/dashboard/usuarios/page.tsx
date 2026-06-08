import { Metadata } from 'next'
import Link from 'next/link'
import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import UsuariosGrid from './usuarios-grid'

export const metadata: Metadata = { title: 'Usuários | Controle ECD/ECF' }

export default async function UsuariosPage() {
  const session = await verifyAdmin()

  const usuarios = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' },
    select: {
      id: true,
      nome: true,
      email: true,
      usuario: true,
      perfil: true,
      status: true,
      data_criacao: true,
      ultimo_acesso: true,
      primeiro_acesso: true,
    },
  })

  return (
    <div className="min-h-full bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 border-b border-slate-700 px-8 py-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-slate-400 uppercase mb-0.5">
              Controle de Obrigações (ECD/ECF)
            </p>
            <h1 className="text-2xl font-black tracking-widest text-white uppercase">Usuários</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/usuarios/novo"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Usuário
            </Link>
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
              {session.nome.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <UsuariosGrid usuarios={usuarios} currentUserId={session.userId} />
    </div>
  )
}
