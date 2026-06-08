import type { SessionPayload } from './session'

export const PERMISSOES = [
  { key: 'empresas',          label: 'Empresas — Ver',           grupo: 'Empresas' },
  { key: 'empresas_editar',   label: 'Empresas — Criar/Editar',  grupo: 'Empresas' },
  { key: 'empresas_importar', label: 'Empresas — Importar',      grupo: 'Empresas' },
  { key: 'obrigacoes',        label: 'Obrigações — Ver',         grupo: 'Obrigações' },
  { key: 'obrigacoes_editar', label: 'Obrigações — Editar',      grupo: 'Obrigações' },
] as const

export type Permissao = typeof PERMISSOES[number]['key']

export function temPermissao(session: SessionPayload | null, perm: Permissao): boolean {
  if (!session) return false
  if (session.perfil === 'ADMINISTRADOR') return true
  return session.permissoes.includes(perm)
}
