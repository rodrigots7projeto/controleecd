import { Metadata } from 'next'
import Link from 'next/link'
import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import UsuarioActions from './usuario-actions'

export const metadata: Metadata = { title: 'Usuários | Controle ECD/ECF' }

export default async function UsuariosPage() {
  await verifyAdmin()

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
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
          <p className="text-gray-500 text-sm mt-1">{usuarios.length} usuário(s) cadastrado(s)</p>
        </div>
        <Link
          href="/dashboard/usuarios/novo"
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuário
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Usuário</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">E-mail</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Perfil</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Último Acesso</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Data Criação</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{u.usuario}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.perfil === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.perfil === 'ADMINISTRADOR' ? 'ADM' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(u.data_criacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <UsuarioActions id={u.id} status={u.status} />
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
