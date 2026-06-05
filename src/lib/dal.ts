import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session?.userId) redirect('/login')
  return session
})

export const verifyAdmin = cache(async () => {
  const session = await verifySession()
  if (session.perfil !== 'ADMINISTRADOR') redirect('/dashboard')
  return session
})

export const getCurrentUser = cache(async () => {
  const session = await verifySession()
  const user = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      nome: true,
      email: true,
      usuario: true,
      perfil: true,
      status: true,
      primeiro_acesso: true,
      ultimo_acesso: true,
    },
  })
  return user
})

export async function registrarAuditoria({
  tabela,
  operacao,
  registro_id,
  campo,
  valor_antes,
  valor_depois,
  descricao,
  usuario_id,
  empresa_id,
}: {
  tabela: string
  operacao: string
  registro_id: string
  campo?: string
  valor_antes?: string
  valor_depois?: string
  descricao?: string
  usuario_id?: string
  empresa_id?: string
}) {
  await prisma.auditoria.create({
    data: {
      tabela,
      operacao,
      registro_id,
      campo,
      valor_antes,
      valor_depois,
      descricao,
      usuario_id,
      empresa_id,
    },
  })
}
