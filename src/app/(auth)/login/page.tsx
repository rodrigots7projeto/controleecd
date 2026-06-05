import { Metadata } from 'next'
import LoginForm from './login-form'

export const metadata: Metadata = { title: 'Login | Controle ECD/ECF' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Controle ECD/ECF</h1>
            <p className="text-blue-200 text-sm mt-1">Sistema de Controle de Obrigações Acessórias</p>
          </div>

          <div className="px-8 py-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Acesso ao Sistema</h2>
            <LoginForm />

            <div className="mt-6 text-center">
              <a href="/recuperar-senha" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                Esqueceu sua senha?
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © {new Date().getFullYear()} Controle ECD/ECF — Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
