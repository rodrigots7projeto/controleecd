'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifySession, registrarAuditoria } from '@/lib/dal'

export type EmpresaFormState = {
  message?: string
  errors?: Record<string, string[]>
}

function normCNPJ(v: string) {
  const d = v.replace(/\D/g, '')
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export async function atualizarEmpresa(
  id: string,
  _state: EmpresaFormState,
  formData: FormData
): Promise<EmpresaFormState> {
  const session = await verifySession()

  const empresa   = (formData.get('empresa') as string ?? '').trim()
  const cnpjRaw   = (formData.get('cnpj')    as string ?? '').trim()
  const grupo     = (formData.get('grupo')    as string ?? '').trim() || null
  const responsavel = (formData.get('responsavel') as string ?? '').trim() || null
  const auxiliar  = (formData.get('auxiliar') as string ?? '').trim() || null
  const resp2025  = (formData.get('responsavel_finalizar_2025') as string ?? '').trim() || null
  const contato   = (formData.get('contato')  as string ?? '').trim() || null
  const situacao  = formData.get('situacao_empresa') as string
  const prioridade = formData.get('prioridade') as string
  const ecdStatus = formData.get('ecd_status') as string
  const ecfStatus = formData.get('ecf_status') as string
  const reciboEcd = (formData.get('recibo_ecd') as string ?? '').trim() || null
  const reciboEcf = (formData.get('recibo_ecf') as string ?? '').trim() || null
  const ordemRaw  = (formData.get('ordem')    as string ?? '').trim()
  const prazoRaw  = (formData.get('prazo')    as string ?? '').trim()

  if (!empresa) return { errors: { empresa: ['Nome da empresa é obrigatório.'] } }
  if (!cnpjRaw) return { errors: { cnpj: ['CNPJ é obrigatório.'] } }

  const cnpj = normCNPJ(cnpjRaw)
  if (cnpj.length < 18) return { errors: { cnpj: ['CNPJ inválido.'] } }

  // Verifica se CNPJ já pertence a outra empresa
  const existente = await prisma.empresa.findFirst({ where: { cnpj, NOT: { id } } })
  if (existente) return { errors: { cnpj: ['CNPJ já cadastrado em outra empresa.'] } }

  const prazo = prazoRaw ? new Date(prazoRaw) : null
  const ordem = ordemRaw ? parseInt(ordemRaw) : null

  const antes = await prisma.empresa.findUnique({ where: { id } })
  if (!antes) return { message: 'Empresa não encontrada.' }

  await prisma.empresa.update({
    where: { id },
    data: {
      empresa,
      cnpj,
      grupo,
      responsavel,
      auxiliar,
      responsavel_finalizar_2025: resp2025,
      contato,
      situacao_empresa: situacao as 'ATIVA' | 'INATIVA' | 'SUSPENSA' | 'BAIXADA',
      prioridade: prioridade as 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE',
      ecd_status: ecdStatus as 'PENDENTE' | 'EM_ANDAMENTO' | 'ENTREGUE' | 'DISPENSADA',
      ecf_status: ecfStatus as 'PENDENTE' | 'EM_ANDAMENTO' | 'ENTREGUE' | 'DISPENSADA',
      recibo_ecd: reciboEcd,
      recibo_ecf: reciboEcf,
      prazo,
      ordem,
      atualizado_por_id: session.userId,
    },
  })

  await registrarAuditoria({
    tabela: 'empresas',
    operacao: 'UPDATE',
    registro_id: id,
    descricao: `Empresa ${empresa} atualizada`,
    usuario_id: session.userId,
    empresa_id: id,
  })

  revalidatePath('/dashboard/empresas')
  revalidatePath(`/dashboard/empresas/${id}`)
  revalidatePath('/dashboard/obrigacoes')

  return { message: 'Empresa atualizada com sucesso!' }
}

export async function excluirEmpresas(ids: string[]): Promise<{ ok: number; error?: string }> {
  const session = await verifySession()

  if (!ids.length) return { ok: 0 }

  const empresas = await prisma.empresa.findMany({
    where: { id: { in: ids } },
    select: { id: true, empresa: true },
  })

  await prisma.auditoria.deleteMany({ where: { empresa_id: { in: ids } } })
  await prisma.empresa.deleteMany({ where: { id: { in: ids } } })

  for (const e of empresas) {
    await registrarAuditoria({
      tabela:      'empresas',
      operacao:    'DELETE',
      registro_id: e.id,
      descricao:   `Empresa ${e.empresa} excluída`,
      usuario_id:  session.userId,
    })
  }

  revalidatePath('/dashboard/empresas')
  revalidatePath('/dashboard/obrigacoes')
  revalidatePath('/dashboard')

  return { ok: empresas.length }
}
