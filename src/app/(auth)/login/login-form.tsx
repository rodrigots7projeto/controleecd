'use client'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="space-y-5">
      {state?.message && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-1">
          E-mail ou Usuário
        </label>
        <input
          id="login"
          name="login"
          type="text"
          autoComplete="username"
          required
          placeholder="seu@email.com ou usuário"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        {state?.errors?.login && (
          <p className="text-red-500 text-xs mt-1">{state.errors.login[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        {state?.errors?.senha && (
          <p className="text-red-500 text-xs mt-1">{state.errors.senha[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </button>
    </form>
  )
}
