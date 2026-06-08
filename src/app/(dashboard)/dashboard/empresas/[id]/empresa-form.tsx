'use client'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarEmpresa } from '@/app/actions/empresas'

type Empresa = {
  id: string
  empresa: string
  cnpj: string
  grupo: string | null
  responsavel: string | null
  auxiliar: string | null
  responsavel_finalizar_2025: string | null
  contato: string | null
  situacao_empresa: string
  prioridade: string
  ecd_status: string
  ecf_status: string
  recibo_ecd: string | null
  recibo_ecf: string | null
  prazo: Date | null
  ordem: number | null
}

type Props = { empresa: Empresa }

const field = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-gray-400 placeholder:font-normal'
const label = 'block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5'

export default function EmpresaForm({ empresa }: Props) {
  const router = useRouter()
  const action = atualizarEmpresa.bind(null, empresa.id)
  const [state, formAction, pending] = useActionState(action, {})

  useEffect(() => {
    if (state?.message && !state.errors) {
      const t = setTimeout(() => router.push('/dashboard/empresas'), 1800)
      return () => clearTimeout(t)
    }
  }, [state, router])

  const prazoFormatado = empresa.prazo
    ? new Date(empresa.prazo).toISOString().split('T')[0]
    : ''

  return (
    <form action={formAction} className="p-6 space-y-6">

      {state?.message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
          state.errors
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {!state.errors && (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {state.message}
        </div>
      )}

      {/* ── Identificação ── */}
      <section>
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-4 h-px bg-gray-200 flex-1" />
          Identificação
          <span className="w-4 h-px bg-gray-200 flex-1" />
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={label}>Nome da Empresa *</label>
            <input name="empresa" type="text" defaultValue={empresa.empresa} required className={field} />
            {state?.errors?.empresa && <p className="text-red-500 text-xs mt-1">{state.errors.empresa[0]}</p>}
          </div>
          <div>
            <label className={label}>CNPJ *</label>
            <input
              name="cnpj"
              type="text"
              defaultValue={empresa.cnpj.startsWith('PENDENTE-') ? '' : empresa.cnpj}
              required
              className={field}
              placeholder={empresa.cnpj.startsWith('PENDENTE-') ? 'Informe o CNPJ' : '99.999.999/9999-99'}
            />
            {empresa.cnpj.startsWith('PENDENTE-') && (
              <p className="text-amber-600 text-xs mt-1 font-medium">⚠ CNPJ não foi informado na importação. Preencha o CNPJ correto.</p>
            )}
            {state?.errors?.cnpj && <p className="text-red-500 text-xs mt-1">{state.errors.cnpj[0]}</p>}
          </div>
          <div>
            <label className={label}>Grupo</label>
            <input name="grupo" type="text" defaultValue={empresa.grupo ?? ''} className={field} />
          </div>
          <div>
            <label className={label}>Contato</label>
            <input name="contato" type="text" defaultValue={empresa.contato ?? ''} className={field} placeholder="(00) 00000-0000 ou e-mail" />
          </div>
          <div>
            <label className={label}>Ordem de exibição</label>
            <input name="ordem" type="number" defaultValue={empresa.ordem ?? ''} className={field} placeholder="Ex: 1" />
          </div>
        </div>
      </section>

      {/* ── Responsáveis ── */}
      <section>
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-4 h-px bg-gray-200 flex-1" />
          Responsáveis
          <span className="w-4 h-px bg-gray-200 flex-1" />
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Responsável</label>
            <input name="responsavel" type="text" defaultValue={empresa.responsavel ?? ''} className={field} />
          </div>
          <div>
            <label className={label}>Auxiliar</label>
            <input name="auxiliar" type="text" defaultValue={empresa.auxiliar ?? ''} className={field} />
          </div>
          <div>
            <label className={label}>Resp. Finalizar 2025</label>
            <input name="responsavel_finalizar_2025" type="text" defaultValue={empresa.responsavel_finalizar_2025 ?? ''} className={field} />
          </div>
        </div>
      </section>

      {/* ── Classificação ── */}
      <section>
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-4 h-px bg-gray-200 flex-1" />
          Classificação
          <span className="w-4 h-px bg-gray-200 flex-1" />
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Situação da Empresa</label>
            <select name="situacao_empresa" defaultValue={empresa.situacao_empresa} className={field}>
              <option value="ATIVA">Ativa</option>
              <option value="INATIVA">Inativa</option>
              <option value="SUSPENSA">Suspensa</option>
              <option value="BAIXADA">Baixada</option>
            </select>
          </div>
          <div>
            <label className={label}>Prioridade</label>
            <select name="prioridade" defaultValue={empresa.prioridade} className={field}>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <div>
            <label className={label}>Prazo</label>
            <input name="prazo" type="date" defaultValue={prazoFormatado} className={field} />
          </div>
        </div>
      </section>

      {/* ── Obrigações ECD / ECF ── */}
      <section>
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-4 h-px bg-gray-200 flex-1" />
          Obrigações ECD / ECF
          <span className="w-4 h-px bg-gray-200 flex-1" />
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">ECD — Escrituração Contábil Digital</p>
            <div>
              <label className={label}>Status ECD</label>
              <select name="ecd_status" defaultValue={empresa.ecd_status} className={field}>
                <option value="PENDENTE">Pendente</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="ENTREGUE">Entregue</option>
                <option value="DISPENSADA">Dispensada</option>
              </select>
            </div>
            <div>
              <label className={label}>Número do Recibo ECD</label>
              <input name="recibo_ecd" type="text" defaultValue={empresa.recibo_ecd ?? ''} className={field} placeholder="Número do recibo de entrega" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">ECF — Escrituração Contábil Fiscal</p>
            <div>
              <label className={label}>Status ECF</label>
              <select name="ecf_status" defaultValue={empresa.ecf_status} className={field}>
                <option value="PENDENTE">Pendente</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="ENTREGUE">Entregue</option>
                <option value="DISPENSADA">Dispensada</option>
              </select>
            </div>
            <div>
              <label className={label}>Número do Recibo ECF</label>
              <input name="recibo_ecf" type="text" defaultValue={empresa.recibo_ecf ?? ''} className={field} placeholder="Número do recibo de entrega" />
            </div>
          </div>
        </div>
      </section>

      {/* Botões */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition"
        >
          {pending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Salvando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salvar Alterações
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/empresas')}
          className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 px-5 rounded-xl text-sm transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
