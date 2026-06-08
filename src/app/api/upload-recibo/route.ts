import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file      = formData.get('file')      as File | null
  const empresaId = formData.get('empresaId') as string
  const tipo      = formData.get('tipo')      as string

  if (!file || !empresaId || !tipo) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo deve ter no máximo 10 MB' }, { status: 400 })
  }

  const bytes    = await file.arrayBuffer()
  const buffer   = Buffer.from(bytes)
  const filename = `${empresaId}-${tipo.toLowerCase()}-${Date.now()}.pdf`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'recibos')

  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ path: `/uploads/recibos/${filename}` })
}
