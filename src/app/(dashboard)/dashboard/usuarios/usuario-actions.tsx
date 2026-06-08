'use client'
import { useState } from 'react'
import Link from 'next/link'
import { excluirUsuario, alternarStatusUsuario, resetarSenha } from '@/app/actions/usuarios'

type Props = { id: string; status: string }

export default function UsuarioActions({ id, status }: Props) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleAction(fn: (id: string) => Promise<{ message?: string } | undefined>) {
    setLoading(true)
    const result = await fn(id)
    if (result?.message) setMsg(result.message)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1 justify-center">
      {msg && (
        <span className="text-xs text-green-600 mr-2 max-w-[120px] truncate" title={msg}>{msg}</span>
      )}
      <Link
        href={`/dashboard/usuarios/${id}/editar`}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
        title="Editar"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </Link>

      <button
        onClick={() => handleAction(alternarStatusUsuario)}
        disabled={loading}
        className={`p-1.5 rounded transition ${status === 'ATIVO' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
        title={status === 'ATIVO' ? 'Desativar' : 'Ativar'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={status === 'ATIVO' ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
        </svg>
      </button>

      <button
        onClick={() => {
          if (confirm('Resetar senha para "Mudar@123"?')) handleAction(resetarSenha)
        }}
        disabled={loading}
        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition"
        title="Resetar Senha"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </button>

      <button
        onClick={() => {
          if (confirm('Excluir este usuário? Esta ação não pode ser desfeita.')) handleAction(excluirUsuario)
        }}
        disabled={loading}
        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
        title="Excluir"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
