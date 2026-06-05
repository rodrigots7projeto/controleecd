'use server'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession, getSession } from '@/lib/session'
import { LoginSchema, AlterarSenhaSchema, FormState } from '@/lib/definitions'

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  const validated = LoginSchema.safeParse({
    login: formData.get('login'),
    senha: formData.get('senha'),
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { login, senha } = validated.data

  const usuario = await prisma.usuario.findFirst({
    where: {
      OR: [{ email: login }, { usuario: login }],
      status: 'ATIVO',
    },
  })

  if (!usuario) {
    return { message: 'Credenciais inválidas. Verifique seu e-mail/usuário e senha.' }
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)
  if (!senhaValida) {
    return { message: 'Credenciais inválidas. Verifique seu e-mail/usuário e senha.' }
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimo_acesso: new Date() },
  })

  await createSession({
    userId: usuario.id,
    nome: usuario.nome,
    perfil: usuario.perfil as 'ADMINISTRADOR' | 'USUARIO',
    primeiro_acesso: usuario.primeiro_acesso,
  })

  if (usuario.primeiro_acesso) {
    redirect('/alterar-senha')
  }

  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

export async function alterarSenha(state: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const validated = AlterarSenhaSchema.safeParse({
    senha_atual: formData.get('senha_atual'),
    nova_senha: formData.get('nova_senha'),
    confirmar_senha: formData.get('confirmar_senha'),
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { senha_atual, nova_senha } = validated.data

  const usuario = await prisma.usuario.findUnique({ where: { id: session.userId } })
  if (!usuario) redirect('/login')

  const senhaValida = await bcrypt.compare(senha_atual, usuario.senha_hash)
  if (!senhaValida) {
    return { errors: { senha_atual: ['Senha atual incorreta.'] } }
  }

  const novoHash = await bcrypt.hash(nova_senha, 12)
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senha_hash: novoHash, primeiro_acesso: false },
  })

  await createSession({
    userId: usuario.id,
    nome: usuario.nome,
    perfil: usuario.perfil as 'ADMINISTRADOR' | 'USUARIO',
    primeiro_acesso: false,
  })

  redirect('/dashboard')
}
