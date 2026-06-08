import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// Colunas exatamente na ordem e com os nomes da planilha do usuário
const COLUNAS = [
  'RESPONSÁVEL',
  'Auxiliar',
  'RESPONSÁVEL POR FINALIZAR 2025',
  'SITUAÇÃO DAS EMPRESAS',
  'PRIORIDADES',
  'PRAZO',
  'EMPRESA',
  'CNPJ',
  'Plano de Contas',
  'VOLUME',
  'ECD',
  'ECF',
  'TRIBUTAÇÃO',
]

export async function GET() {
  const exemplos = [
    {
      'RESPONSÁVEL': 'RODRIGO',
      'Auxiliar': 'MICHELI',
      'RESPONSÁVEL POR FINALIZAR 2025': 'RODRIGO',
      'SITUAÇÃO DAS EMPRESAS': 'ATIVA',
      'PRIORIDADES': 'ALTA',
      'PRAZO': '31/12/2025',
      'EMPRESA': 'EMPRESA MODELO LTDA',
      'CNPJ': '12.345.678/0001-99',
      'Plano de Contas': '',
      'VOLUME': '',
      'ECD': 'PENDENTE',
      'ECF': 'PENDENTE',
      'TRIBUTAÇÃO': 'LUCRO PRESUMIDO',
    },
    {
      'RESPONSÁVEL': 'ANA',
      'Auxiliar': '',
      'RESPONSÁVEL POR FINALIZAR 2025': 'ANA',
      'SITUAÇÃO DAS EMPRESAS': 'ATIVA',
      'PRIORIDADES': 'MEDIA',
      'PRAZO': '31/07/2025',
      'EMPRESA': 'COMERCIO EXEMPLO SA',
      'CNPJ': '98.765.432/0001-11',
      'Plano de Contas': '',
      'VOLUME': '',
      'ECD': 'EM_ANDAMENTO',
      'ECF': 'PENDENTE',
      'TRIBUTAÇÃO': 'SIMPLES NACIONAL',
    },
    {
      'RESPONSÁVEL': 'CARLOS',
      'Auxiliar': '',
      'RESPONSÁVEL POR FINALIZAR 2025': '',
      'SITUAÇÃO DAS EMPRESAS': 'INATIVA',
      'PRIORIDADES': 'BAIXA',
      'PRAZO': '',
      'EMPRESA': 'INDUSTRIA INATIVA EIRELI',
      'CNPJ': '11.222.333/0001-44',
      'Plano de Contas': '',
      'VOLUME': '',
      'ECD': 'DISPENSADA',
      'ECF': 'DISPENSADA',
      'TRIBUTAÇÃO': 'LUCRO REAL',
    },
  ]

  const wb = XLSX.utils.book_new()

  // Aba principal com as colunas exatas
  const ws = XLSX.utils.json_to_sheet(exemplos, { header: COLUNAS })

  ws['!cols'] = [
    { wch: 18 }, // RESPONSÁVEL
    { wch: 15 }, // Auxiliar
    { wch: 32 }, // RESPONSÁVEL POR FINALIZAR 2025
    { wch: 22 }, // SITUAÇÃO DAS EMPRESAS
    { wch: 12 }, // PRIORIDADES
    { wch: 14 }, // PRAZO
    { wch: 40 }, // EMPRESA
    { wch: 20 }, // CNPJ
    { wch: 15 }, // Plano de Contas
    { wch: 10 }, // VOLUME
    { wch: 14 }, // ECD
    { wch: 14 }, // ECF
    { wch: 18 }, // TRIBUTAÇÃO
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Empresas')

  // Aba de referência
  const ref = [
    { Campo: 'SITUAÇÃO DAS EMPRESAS', 'Valores aceitos': 'ATIVA | INATIVA | SUSPENSA | BAIXADA' },
    { Campo: 'PRIORIDADES',           'Valores aceitos': 'BAIXA | MEDIA | ALTA | URGENTE' },
    { Campo: 'ECD',                   'Valores aceitos': 'PENDENTE | EM_ANDAMENTO | ENTREGUE | DISPENSADA' },
    { Campo: 'ECF',                   'Valores aceitos': 'PENDENTE | EM_ANDAMENTO | ENTREGUE | DISPENSADA' },
    { Campo: 'CNPJ',                  'Valores aceitos': 'Formato: 99.999.999/9999-99 ou apenas os números' },
    { Campo: 'PRAZO',                 'Valores aceitos': 'dd/mm/aaaa' },
    { Campo: 'Plano de Contas',       'Valores aceitos': '(ignorado na importação)' },
    { Campo: 'VOLUME',                'Valores aceitos': '(ignorado na importação)' },
    { Campo: 'TRIBUTAÇÃO',            'Valores aceitos': '(ignorado na importação)' },
  ]
  const wsRef = XLSX.utils.json_to_sheet(ref)
  wsRef['!cols'] = [{ wch: 30 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referência')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modelo-importacao-empresas.xlsx"',
    },
  })
}
