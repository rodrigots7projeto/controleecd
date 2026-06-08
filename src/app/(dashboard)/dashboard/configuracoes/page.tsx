import { Metadata } from 'next'
import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import ConfiguracoesPainel from './configuracoes-painel'

export const metadata: Metadata = { title: 'Configurações | Controle ECD/ECF' }

export default async function ConfiguracoesPage() {
  const session = await verifyAdmin()

  const [
    logs,
    totalLogs,
    totalEmpresas,
    totalUsuarios,
    empresasPorStatus,
    empresasEcd,
    empresasEcf,
  ] = await Promise.all([
    prisma.auditoria.findMany({
      orderBy: { data: 'desc' },
      take: 500,
      include: {
        usuario: { select: { nome: true, usuario: true } },
        empresa:  { select: { empresa: true, cnpj: true } },
      },
    }),
    prisma.auditoria.count(),
    prisma.empresa.count(),
    prisma.usuario.count({ where: { status: 'ATIVO' } }),
    prisma.empresa.groupBy({ by: ['situacao_empresa'], _count: true }),
    prisma.empresa.groupBy({ by: ['ecd_status'], _count: true }),
    prisma.empresa.groupBy({ by: ['ecf_status'], _count: true }),
  ])

  return (
    <ConfiguracoesPainel
      logs={logs as LogEntry[]}
      totalLogs={totalLogs}
      totalEmpresas={totalEmpresas}
      totalUsuarios={totalUsuarios}
      empresasPorStatus={empresasPorStatus as StatusCount[]}
      empresasEcd={empresasEcd as StatusCount[]}
      empresasEcf={empresasEcf as StatusCount[]}
      adminNome={session.nome}
    />
  )
}

export type LogEntry = {
  id: string
  tabela: string
  operacao: string
  registro_id: string
  campo: string | null
  valor_antes: string | null
  valor_depois: string | null
  descricao: string | null
  data: Date
  usuario_id: string | null
  empresa_id: string | null
  usuario: { nome: string; usuario: string } | null
  empresa:  { empresa: string; cnpj: string } | null
}

export type StatusCount = {
  situacao_empresa?: string
  ecd_status?: string
  ecf_status?: string
  _count: number | { _all: number }
}
