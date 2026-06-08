import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'
import PainelGerencial from './painel-gerencial'

export const metadata: Metadata = { title: 'Painel Gerencial | Controle ECD/ECF' }

export default async function DashboardPage() {
  const session = await verifySession()

  const empresas = await prisma.empresa.findMany({
    where: { situacao_empresa: { in: ['ATIVA', 'SUSPENSA'] } },
    select: {
      id: true,
      empresa: true,
      cnpj: true,
      responsavel: true,
      prioridade: true,
      prazo: true,
      ecd_status: true,
      ecf_status: true,
      recibo_ecd: true,
      recibo_ecf: true,
    },
    orderBy: { empresa: 'asc' },
  })

  return <PainelGerencial empresas={empresas} session={session} />
}
