import { z } from 'zod'

export const LoginSchema = z.object({
  login: z.string().min(1, { message: 'Informe o e-mail ou usuário.' }),
  senha: z.string().min(1, { message: 'Informe a senha.' }),
})

export const AlterarSenhaSchema = z
  .object({
    senha_atual: z.string().min(1, { message: 'Informe a senha atual.' }),
    nova_senha: z.string().min(6, { message: 'A nova senha deve ter pelo menos 6 caracteres.' }),
    confirmar_senha: z.string().min(6, { message: 'Confirme a nova senha.' }),
  })
  .refine((data) => data.nova_senha === data.confirmar_senha, {
    message: 'As senhas não coincidem.',
    path: ['confirmar_senha'],
  })

export const CriarUsuarioSchema = z.object({
  nome: z.string().min(2, { message: 'Nome deve ter ao menos 2 caracteres.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  usuario: z.string().min(3, { message: 'Usuário deve ter ao menos 3 caracteres.' }).regex(/^\S+$/, { message: 'Usuário não pode ter espaços.' }),
  senha: z.string().min(6, { message: 'Senha deve ter ao menos 6 caracteres.' }),
  perfil: z.enum(['ADMINISTRADOR', 'USUARIO']),
  status: z.enum(['ATIVO', 'INATIVO']),
})

export const EditarUsuarioSchema = z.object({
  nome: z.string().min(2, { message: 'Nome deve ter ao menos 2 caracteres.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  usuario: z.string().min(3, { message: 'Usuário deve ter ao menos 3 caracteres.' }).regex(/^\S+$/, { message: 'Usuário não pode ter espaços.' }),
  perfil: z.enum(['ADMINISTRADOR', 'USUARIO']),
  status: z.enum(['ATIVO', 'INATIVO']),
  nova_senha: z.string().optional(),
})

export type FormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined
