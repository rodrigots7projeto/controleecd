'use client'
import { useActionState, useState, useEffect } from 'react'
import { criarUsuario, editarUsuario } from '@/app/actions/usuarios'
import { useRouter } from 'next/navigation'
import { PERMISSOES } from '@/lib/permissoes'

type Usuario = {
  id: string
  nome: string
  email: string
  usuario: string
  perfil: string
  status: string
  permissoes: string[]
}
type Props = { usuario?: Usuario }

export default function UsuarioForm({ usuario }: Props) {
  const router = useRouter()
  const isEditing = !!usuario

  const action = isEditing
    ? editarUsuario.bind(null, usuario.id)
    : criarUsuario

  const [state, formAction, pending] = useActionState(action, undefined)
  const [perfil, setPerfil] = useState(usuario?.perfil ?? 'USUARIO')

  useEffect(() => {
    if (state?.message && !state.errors) {
      setTimeout(() => router.push('/dashboard/usuarios'), 1500)
    }
  }, [state, router])

  const grupos = Array.from(new Set(PERMISSOES.map(p => p.grupo)))

  return (
    <form action={formAction} className="space-y-5">
      {state?.message && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${state.errors ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
          <input
            name="nome"
            type="text"
            defaultValue={usuario?.nome}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {state?.errors?.nome && <p className="text-red-500 text-xs mt-1">{state.errors.nome[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
            <input
              name="email"
              type="email"
              defaultValue={usuario?.email}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {state?.errors?.email && <p className="text-red-500 text-xs mt-1">{state.errors.email[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário *</label>
            <input
              name="usuario"
              type="text"
              defaultValue={usuario?.usuario}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {state?.errors?.usuario && <p className="text-red-500 text-xs mt-1">{state.errors.usuario[0]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perfil *</label>
            <select
              name="perfil"
              value={perfil}
              onChange={e => setPerfil(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="USUARIO">Usuário</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              name="status"
              defaultValue={usuario?.status ?? 'ATIVO'}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>
        </div>

        {isEditing ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha <span className="text-gray-400 font-normal">(deixe em branco para manter)</span>
            </label>
            <input
              name="nova_senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
            <input
              name="senha"
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {state?.errors?.senha && <p className="text-red-500 text-xs mt-1">{state.errors.senha[0]}</p>}
          </div>
        )}

        {perfil === 'USUARIO' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Permissões de Acesso</label>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {grupos.map(grupo => (
                <div key={grupo} className="p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{grupo}</p>
                  <div className="space-y-2">
                    {PERMISSOES.filter(p => p.grupo === grupo).map(p => (
                      <label key={p.key} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          name="permissoes"
                          value={p.key}
                          defaultChecked={usuario?.permissoes?.includes(p.key)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Administradores têm acesso total automaticamente.</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition flex items-center gap-2"
        >
          {pending ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/usuarios')}
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-6 rounded-lg text-sm transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
