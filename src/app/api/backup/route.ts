import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await verifySession()
  if (session.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  const [usuarios, empresas, auditorias] = await Promise.all([
    prisma.usuario.findMany({ orderBy: { data_criacao: 'asc' } }),
    prisma.empresa.findMany({ orderBy: { data_criacao: 'asc' } }),
    prisma.auditoria.findMany({ orderBy: { data: 'asc' } }),
  ])

  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: { usuarios, empresas, auditorias },
  }

  const json = JSON.stringify(backup, null, 2)
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="backup-controleecd-${date}.json"`,
    },
  })
}
