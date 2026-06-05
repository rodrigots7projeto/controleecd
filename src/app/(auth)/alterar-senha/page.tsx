import { Metadata } from 'next'
import AlterarSenhaForm from './alterar-senha-form'

export const metadata: Metadata = { title: 'Alterar Senha | Controle ECD/ECF' }

export default function AlterarSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Primeiro Acesso</h1>
            <p className="text-amber-100 text-sm mt-1">Por segurança, altere sua senha padrão</p>
          </div>

          <div className="px-8 py-8">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm">
                <strong>Atenção:</strong> Esta é sua senha padrão de acesso. Por segurança, é obrigatório criar uma nova senha personalizada antes de continuar.
              </p>
            </div>
            <AlterarSenhaForm />
          </div>
        </div>
      </div>
    </div>
  )
}
