import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import ControleObrigacoes from '../controle-obrigacoes'

type Props = { params: Promise<{ tipo: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tipo } = await params
  const label = tipo.toUpperCase() === 'ECD' ? 'ECD' : 'ECF'
  return { title: `Controle ${label} | Controle ECD/ECF` }
}

export default async function ControleTipoPage({ params }: Props) {
  const { tipo } = await params
  const tipoUpper = tipo.toUpperCase()
  if (tipoUpper !== 'ECD' && tipoUpper !== 'ECF') notFound()

  const session = await verifySession()

  const empresas = await prisma.empresa.findMany({
    where: { situacao_empresa: { in: ['ATIVA', 'SUSPENSA'] } },
    orderBy: [{ ordem: 'asc' }, { empresa: 'asc' }],
    select: {
      id: true,
      empresa: true,
      cnpj: true,
      responsavel: true,
      auxiliar: true,
      prioridade: true,
      prazo: true,
      ecd_status: true,
      ecf_status: true,
      recibo_ecd: true,
      recibo_ecf: true,
      comentario_ecd: true,
      comentario_ecf: true,
      situacao_empresa: true,
    },
  })

  return (
    <ControleObrigacoes
      empresas={empresas}
      perfil={session.perfil}
      nome={session.nome}
      tipoFixo={tipoUpper as 'ECD' | 'ECF'}
    />
  )
}
