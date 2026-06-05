'use client'
import { useActionState } from 'react'
import { alterarSenha } from '@/app/actions/auth'

export default function AlterarSenhaForm() {
  const [state, action, pending] = useActionState(alterarSenha, undefined)

  return (
    <form action={action} className="space-y-5">
      {state?.message && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="senha_atual" className="block text-sm font-medium text-gray-700 mb-1">
          Senha Atual
        </label>
        <input
          id="senha_atual"
          name="senha_atual"
          type="password"
          required
          placeholder="••••••••"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
        />
        {state?.errors?.senha_atual && (
          <p className="text-red-500 text-xs mt-1">{state.errors.senha_atual[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="nova_senha" className="block text-sm font-medium text-gray-700 mb-1">
          Nova Senha
        </label>
        <input
          id="nova_senha"
          name="nova_senha"
          type="password"
          required
          placeholder="Mínimo 6 caracteres"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
        />
        {state?.errors?.nova_senha && (
          <p className="text-red-500 text-xs mt-1">{state.errors.nova_senha[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmar_senha" className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar Nova Senha
        </label>
        <input
          id="confirmar_senha"
          name="confirmar_senha"
          type="password"
          required
          placeholder="Repita a nova senha"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
        />
        {state?.errors?.confirmar_senha && (
          <p className="text-red-500 text-xs mt-1">{state.errors.confirmar_senha[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Salvando...
          </>
        ) : (
          'Salvar Nova Senha e Continuar'
        )}
      </button>
    </form>
  )
}
