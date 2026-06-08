'use server'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { verifyAdmin, registrarAuditoria } from '@/lib/dal'
import { CriarUsuarioSchema, EditarUsuarioSchema, FormState } from '@/lib/definitions'

export async function criarUsuario(state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifyAdmin()

  const validated = CriarUsuarioSchema.safeParse({
    nome: formData.get('nome'),
    email: formData.get('email'),
    usuario: formData.get('usuario'),
    senha: formData.get('senha'),
    perfil: formData.get('perfil'),
    status: formData.get('status'),
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { nome, email, usuario, senha, perfil, status } = validated.data
  const permissoes = formData.getAll('permissoes').map(String)

  const existente = await prisma.usuario.findFirst({
    where: { OR: [{ email }, { usuario }] },
  })
  if (existente) {
    return { message: 'E-mail ou nome de usuário já está em uso.' }
  }

  const senha_hash = await bcrypt.hash(senha, 12)
  const novo = await prisma.usuario.create({
    data: { nome, email, usuario, senha_hash, perfil, status, permissoes },
  })

  await registrarAuditoria({
    tabela: 'usuarios',
    operacao: 'CREATE',
    registro_id: novo.id,
    descricao: `Usuário ${nome} criado`,
    usuario_id: session.userId,
  })

  revalidatePath('/dashboard/usuarios')
  return { message: 'Usuário criado com sucesso.' }
}

export async function editarUsuario(
  id: string,
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await verifyAdmin()

  const validated = EditarUsuarioSchema.safeParse({
    nome: formData.get('nome'),
    email: formData.get('email'),
    usuario: formData.get('usuario'),
    perfil: formData.get('perfil'),
    status: formData.get('status'),
    nova_senha: formData.get('nova_senha') || undefined,
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { nome, email, usuario, perfil, status, nova_senha } = validated.data
  const permissoes = formData.getAll('permissoes').map(String)

  const existente = await prisma.usuario.findFirst({
    where: { OR: [{ email }, { usuario }], NOT: { id } },
  })
  if (existente) {
    return { message: 'E-mail ou nome de usuário já está em uso por outro usuário.' }
  }

  const updateData: Record<string, unknown> = { nome, email, usuario, perfil, status, permissoes }
  if (nova_senha && nova_senha.length >= 6) {
    updateData.senha_hash = await bcrypt.hash(nova_senha, 12)
    updateData.primeiro_acesso = true
  }

  await prisma.usuario.update({ where: { id }, data: updateData })

  await registrarAuditoria({
    tabela: 'usuarios',
    operacao: 'UPDATE',
    registro_id: id,
    descricao: `Usuário ${nome} editado`,
    usuario_id: session.userId,
  })

  revalidatePath('/dashboard/usuarios')
  return { message: 'Usuário atualizado com sucesso.' }
}

export async function excluirUsuario(id: string): Promise<FormState> {
  const session = await verifyAdmin()

  if (id === session.userId) {
    return { message: 'Você não pode excluir sua própria conta.' }
  }

  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) return { message: 'Usuário não encontrado.' }

  await prisma.usuario.delete({ where: { id } })

  await registrarAuditoria({
    tabela: 'usuarios',
    operacao: 'DELETE',
    registro_id: id,
    descricao: `Usuário ${usuario.nome} excluído`,
    usuario_id: session.userId,
  })

  revalidatePath('/dashboard/usuarios')
  return { message: 'Usuário excluído com sucesso.' }
}

export async function alternarStatusUsuario(id: string): Promise<FormState> {
  const session = await verifyAdmin()

  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) return { message: 'Usuário não encontrado.' }

  const novoStatus = usuario.status === 'ATIVO' ? 'INATIVO' : 'ATIVO'
  await prisma.usuario.update({ where: { id }, data: { status: novoStatus } })

  await registrarAuditoria({
    tabela: 'usuarios',
    operacao: 'STATUS',
    registro_id: id,
    descricao: `Status alterado para ${novoStatus}`,
    usuario_id: session.userId,
  })

  revalidatePath('/dashboard/usuarios')
  return { message: `Usuário ${novoStatus === 'ATIVO' ? 'ativado' : 'desativado'} com sucesso.` }
}

export async function resetarSenha(id: string): Promise<FormState> {
  const session = await verifyAdmin()

  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) return { message: 'Usuário não encontrado.' }

  const novoHash = await bcrypt.hash('Mudar@123', 12)
  await prisma.usuario.update({
    where: { id },
    data: { senha_hash: novoHash, primeiro_acesso: true },
  })

  await registrarAuditoria({
    tabela: 'usuarios',
    operacao: 'RESET_SENHA',
    registro_id: id,
    descricao: `Senha de ${usuario.nome} resetada. Nova senha: Mudar@123`,
    usuario_id: session.userId,
  })

  revalidatePath('/dashboard/usuarios')
  return { message: `Senha resetada para "Mudar@123". O usuário deverá trocá-la no próximo acesso.` }
}
