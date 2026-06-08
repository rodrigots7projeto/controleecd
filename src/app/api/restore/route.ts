import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria } from '@/lib/dal'

type BackupData = {
  version: string
  exportedAt: string
  data: {
    usuarios: Record<string, unknown>[]
    empresas: Record<string, unknown>[]
    auditorias: Record<string, unknown>[]
  }
}

export async function POST(req: NextRequest) {
  const session = await verifySession()
  if (session.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  let backup: BackupData
  try {
    const text = await req.text()
    backup = JSON.parse(text) as BackupData
  } catch {
    return NextResponse.json({ error: 'Arquivo inválido. Envie um JSON de backup válido.' }, { status: 400 })
  }

  if (!backup.version || !backup.data?.usuarios || !backup.data?.empresas) {
    return NextResponse.json({ error: 'Formato de backup inválido.' }, { status: 400 })
  }

  const { usuarios, empresas, auditorias } = backup.data

  // Delete in FK order
  await prisma.auditoria.deleteMany()
  await prisma.empresa.deleteMany()
  await prisma.usuario.deleteMany()

  // Re-insert
  for (const u of usuarios) {
    await prisma.usuario.create({
      data: {
        id:              u.id as string,
        nome:            u.nome as string,
        email:           u.email as string,
        usuario:         u.usuario as string,
        senha_hash:      u.senha_hash as string,
        perfil:          u.perfil as 'ADMINISTRADOR' | 'USUARIO',
        status:          (u.status as 'ATIVO' | 'INATIVO') ?? 'ATIVO',
        primeiro_acesso: (u.primeiro_acesso as boolean) ?? false,
        data_criacao:    new Date(u.data_criacao as string),
        ultimo_acesso:   u.ultimo_acesso ? new Date(u.ultimo_acesso as string) : null,
      },
    })
  }

  for (const e of empresas) {
    await prisma.empresa.create({
      data: {
        id:                         e.id as string,
        empresa:                    e.empresa as string,
        cnpj:                       e.cnpj as string,
        grupo:                      (e.grupo as string | null) ?? null,
        data_abertura:              e.data_abertura ? new Date(e.data_abertura as string) : null,
        contato:                    (e.contato as string | null) ?? null,
        responsavel:                (e.responsavel as string | null) ?? null,
        auxiliar:                   (e.auxiliar as string | null) ?? null,
        responsavel_finalizar_2025: (e.responsavel_finalizar_2025 as string | null) ?? null,
        situacao_empresa:           (e.situacao_empresa as 'ATIVA' | 'INATIVA' | 'SUSPENSA' | 'BAIXADA') ?? 'ATIVA',
        ordem:                      (e.ordem as number | null) ?? null,
        prioridade:                 (e.prioridade as 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE') ?? 'MEDIA',
        prazo:                      e.prazo ? new Date(e.prazo as string) : null,
        ecd_status:                 (e.ecd_status as 'PENDENTE' | 'EM_ANDAMENTO' | 'ENTREGUE' | 'DISPENSADA' | 'ENTREGUE_RETIFICAR' | 'RETIFICADO_OK') ?? 'PENDENTE',
        ecf_status:                 (e.ecf_status as 'PENDENTE' | 'EM_ANDAMENTO' | 'ENTREGUE' | 'DISPENSADA' | 'ENTREGUE_RETIFICAR' | 'RETIFICADO_OK') ?? 'PENDENTE',
        recibo_ecd:                 (e.recibo_ecd as string | null) ?? null,
        recibo_ecf:                 (e.recibo_ecf as string | null) ?? null,
        comentario_ecd:             (e.comentario_ecd as string | null) ?? null,
        comentario_ecf:             (e.comentario_ecf as string | null) ?? null,
        criado_por_id:              (e.criado_por_id as string | null) ?? null,
        atualizado_por_id:          (e.atualizado_por_id as string | null) ?? null,
        data_criacao:               new Date(e.data_criacao as string),
      },
    })
  }

  for (const a of auditorias) {
    await prisma.auditoria.create({
      data: {
        id:           a.id as string,
        tabela:       a.tabela as string,
        operacao:     a.operacao as string,
        registro_id:  a.registro_id as string,
        campo:        (a.campo as string | null) ?? null,
        valor_antes:  (a.valor_antes as string | null) ?? null,
        valor_depois: (a.valor_depois as string | null) ?? null,
        descricao:    (a.descricao as string | null) ?? null,
        data:         new Date(a.data as string),
        usuario_id:   (a.usuario_id as string | null) ?? null,
        empresa_id:   (a.empresa_id as string | null) ?? null,
      },
    })
  }

  await registrarAuditoria({
    tabela:      'sistema',
    operacao:    'IMPORT',
    registro_id: 'backup',
    descricao:   `Backup restaurado por ${session.nome} — ${usuarios.length} usuários, ${empresas.length} empresas, ${auditorias.length} logs`,
    usuario_id:  session.userId,
  })

  return NextResponse.json({
    ok: true,
    restored: {
      usuarios: usuarios.length,
      empresas: empresas.length,
      auditorias: auditorias.length,
    },
  })
}
