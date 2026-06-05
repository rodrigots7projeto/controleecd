'use client'
import { logout } from '@/app/actions/auth'

type HeaderProps = { nome: string; perfil: 'ADMINISTRADOR' | 'USUARIO' }

export default function Header({ nome, perfil }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{nome}</p>
          <p className="text-xs text-gray-500">{perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Usuário'}</p>
        </div>
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {nome.charAt(0).toUpperCase()}
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Sair"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  )
}
