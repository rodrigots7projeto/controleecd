'use server'
import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'

export type EmpresaImport = {
  empresa: string
  cnpj: string
  grupo?: string
  responsavel?: string
  auxiliar?: string
  responsavel_finalizar_2025?: string
  situacao_empresa?: string
  prioridade?: string
  prazo?: string
  ecd_status?: string
  ecf_status?: string
  contato?: string
  ordem?: number
}

function normalizarCNPJ(cnpj: string): string {
  return cnpj.replace(/[^\d]/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

function mapearSituacao(val: string): 'ATIVA' | 'INATIVA' | 'SUSPENSA' | 'BAIXADA' {
  const v = (val ?? '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (v.includes('INAT') || v.includes('ENCERR')) return 'INATIVA'
  if (v.includes('SUSP')) return 'SUSPENSA'
  if (v.includes('BAIR') || v.includes('BAIX') || v.includes('CANCEL')) return 'BAIXADA'
  return 'ATIVA'
}

function mapearPrioridade(val: string): 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE' {
  const v = (val ?? '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (v.includes('URG')) return 'URGENTE'
  if (v.includes('ALTA') || v.includes('HIGH')) return 'ALTA'
  if (v.includes('BAIR') || v.includes('BAIXA') || v.includes('LOW')) return 'BAIXA'
  return 'MEDIA'
}

function mapearStatusECD(val: string): 'PENDENTE' | 'EM_ANDAMENTO' | 'ENTREGUE' | 'DISPENSADA' {
  const v = (val ?? '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (v.includes('ENTREGUE') || v.includes('CONCLU') || v.includes('OK')) return 'ENTREGUE'
  if (v.includes('ANDAMENTO') || v.includes('EM CURSO')) return 'EM_ANDAMENTO'
  if (v.includes('DISP') || v.includes('ISENT') || v.includes('N/A')) return 'DISPENSADA'
  return 'PENDENTE'
}

export async function importarEmpresas(empresas: EmpresaImport[]): Promise<{ ok: number; skip: number; errors: string[] }> {
  await verifyAdmin()

  let ok = 0
  let skip = 0
  const errors: string[] = []

  for (const emp of empresas) {
    try {
      const prazoDate = emp.prazo ? new Date(emp.prazo) : null
      const prazoValido = prazoDate && !isNaN(prazoDate.getTime()) ? prazoDate : null

      const cnpjRaw = (emp.cnpj ?? '').trim()
      const cnpjLimpo = normalizarCNPJ(cnpjRaw)
      const temCnpjValido = cnpjLimpo.length >= 18

      const data = {
        empresa: emp.empresa.trim(),
        grupo: emp.grupo?.trim() || null,
        responsavel: emp.responsavel?.trim() || null,
        auxiliar: emp.auxiliar?.trim() || null,
        responsavel_finalizar_2025: emp.responsavel_finalizar_2025?.trim() || null,
        situacao_empresa: mapearSituacao(emp.situacao_empresa ?? ''),
        prioridade: mapearPrioridade(emp.prioridade ?? ''),
        prazo: prazoValido,
        ecd_status: mapearStatusECD(emp.ecd_status ?? ''),
        ecf_status: mapearStatusECD(emp.ecf_status ?? ''),
        contato: emp.contato?.trim() || null,
        ordem: emp.ordem ?? null,
      }

      if (temCnpjValido) {
        // CNPJ informado — faz upsert para não duplicar
        await prisma.empresa.upsert({
          where: { cnpj: cnpjLimpo },
          create: { ...data, cnpj: cnpjLimpo },
          update: data,
        })
      } else {
        // Sem CNPJ — gera placeholder único e cria nova empresa
        const placeholder = `PENDENTE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
        await prisma.empresa.create({ data: { ...data, cnpj: placeholder } })
      }

      ok++
    } catch (e) {
      errors.push(`${emp.empresa}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { ok, skip, errors }
}
