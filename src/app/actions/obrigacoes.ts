'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifySession, registrarAuditoria } from '@/lib/dal'

export async function atualizarStatusObrigacao(
  empresaId: string,
  tipo: 'ECD' | 'ECF',
  status: string,
  reciboPath: string | null,
  comentario?: string | null
) {
  const session = await verifySession()

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } })
  if (!empresa) return { error: 'Empresa não encontrada' }

  type EcdEcfStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'ENTREGUE' | 'DISPENSADA' | 'ENTREGUE_RETIFICAR' | 'RETIFICADO_OK'

  const data =
    tipo === 'ECD'
      ? {
          ecd_status: status as EcdEcfStatus,
          ...(reciboPath   !== undefined && { recibo_ecd:      reciboPath }),
          ...(comentario   !== undefined && { comentario_ecd:  comentario }),
        }
      : {
          ecf_status: status as EcdEcfStatus,
          ...(reciboPath   !== undefined && { recibo_ecf:      reciboPath }),
          ...(comentario   !== undefined && { comentario_ecf:  comentario }),
        }

  await prisma.empresa.update({ where: { id: empresaId }, data })

  const statusAntes = tipo === 'ECD' ? empresa.ecd_status : empresa.ecf_status
  await registrarAuditoria({
    tabela:      'empresas',
    operacao:    'UPDATE',
    registro_id: empresaId,
    campo:       `${tipo.toLowerCase()}_status`,
    valor_antes: statusAntes,
    valor_depois: status,
    descricao:   `${tipo} de ${empresa.empresa} alterado para ${status}`,
    usuario_id:  session.userId,
    empresa_id:  empresaId,
  })

  revalidatePath('/dashboard/obrigacoes/ecd')
  revalidatePath('/dashboard/obrigacoes/ecf')
  revalidatePath('/dashboard')

  return { ok: true }
}
