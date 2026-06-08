'use client'
import { useState, useRef } from 'react'
import { importarEmpresas, type EmpresaImport } from '@/app/actions/importar'

type ColMap = {
  empresa: number
  cnpj: number
  responsavel: number
  auxiliar: number
  responsavel_finalizar: number
  situacao: number
  prioridade: number
  prazo: number
  ecd: number
  ecf: number
}

// Nomes de colunas reconhecidos automaticamente (minúsculas normalizadas)
const HEADER_ALIASES: Record<keyof ColMap, string[]> = {
  empresa:                ['empresa', 'nome empresa', 'razão social', 'razao social', 'nome da empresa'],
  cnpj:                   ['cnpj'],
  responsavel:            ['responsável', 'responsavel'],
  auxiliar:               ['auxiliar'],
  responsavel_finalizar:  ['responsável por finalizar 2025', 'responsavel por finalizar 2025', 'resp. finalizar', 'resp finalizar', 'responsável por finalizar'],
  situacao:               ['situação das empresas', 'situacao das empresas', 'situação', 'situacao', 'status empresa', 'situação empresa'],
  prioridade:             ['prioridades', 'prioridade'],
  prazo:                  ['prazo'],
  ecd:                    ['ecd', 'ecd status', 'status ecd'],
  ecf:                    ['ecf', 'ecf status', 'status ecf'],
}

function normalize(s: string) {
  return s.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function detectarColunas(headers: string[]): ColMap {
  const map: ColMap = {
    empresa: -1, cnpj: -1, responsavel: -1, auxiliar: -1,
    responsavel_finalizar: -1, situacao: -1, prioridade: -1,
    prazo: -1, ecd: -1, ecf: -1,
  }

  headers.forEach((h, idx) => {
    const norm = normalize(h)
    for (const key of Object.keys(HEADER_ALIASES) as (keyof ColMap)[]) {
      if (map[key] === -1 && HEADER_ALIASES[key].some(alias => normalize(alias) === norm)) {
        map[key] = idx
      }
    }
  })

  return map
}

export default function ImportadorEmpresas() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows,    setRows]    = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [colMap,  setColMap]  = useState<ColMap>({
    empresa: -1, cnpj: -1, responsavel: -1, auxiliar: -1,
    responsavel_finalizar: -1, situacao: -1, prioridade: -1,
    prazo: -1, ecd: -1, ecf: -1,
  })
  const [autoDetected, setAutoDetected] = useState(false)
  const [preview,   setPreview]   = useState<EmpresaImport[]>([])
  const [ignoradas, setIgnoradas] = useState(0)
  const [step,      setStep]      = useState<'upload' | 'map' | 'preview' | 'done'>('upload')
  const [result,    setResult]    = useState<{ ok: number; skip: number; errors: string[] } | null>(null)
  const [loading,   setLoading]   = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const XLSX = await import('xlsx')
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data, { type: 'array', cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const json: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    const headerRow = json[0] ?? []
    const hdrs = headerRow.map(String)
    const detected = detectarColunas(hdrs)

    setHeaders(hdrs)
    setRows(json.slice(1).filter(r => r.some(c => String(c).trim())))
    setColMap(detected)
    setAutoDetected(detected.empresa >= 0)
    setStep('map')
  }

  function buildPreview() {
    const parsed: EmpresaImport[] = []
    let ignoradas = 0
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const get = (idx: number) => idx >= 0 ? String(r[idx] ?? '').trim() : ''

      const empresa = get(colMap.empresa)
      if (!empresa) { ignoradas++; continue }  // pula só linhas sem nome
      const responsavel = get(colMap.responsavel)
      const cnpj        = get(colMap.cnpj)

      const prazoRaw = get(colMap.prazo)
      let prazo: string | undefined
      if (prazoRaw) {
        const d = new Date(prazoRaw)
        if (!isNaN(d.getTime())) {
          prazo = d.toISOString().split('T')[0]
        } else {
          const parts = prazoRaw.split(/[/\-.]+/)
          if (parts.length === 3) {
            const [a, b, c] = parts
            const yr = c.length === 4 ? c : a
            const mo = c.length === 4 ? b : b
            const dy = c.length === 4 ? a : c
            const d2 = new Date(`${yr}-${mo}-${dy}`)
            if (!isNaN(d2.getTime())) prazo = d2.toISOString().split('T')[0]
          }
        }
      }

      parsed.push({
        empresa,
        cnpj,
        responsavel,
        auxiliar:                  get(colMap.auxiliar) || undefined,
        responsavel_finalizar_2025: get(colMap.responsavel_finalizar) || undefined,
        situacao_empresa:          get(colMap.situacao) || undefined,
        prioridade:                get(colMap.prioridade) || undefined,
        prazo,
        ecd_status:                get(colMap.ecd) || undefined,
        ecf_status:                get(colMap.ecf) || undefined,
        ordem: i + 1,
      })
    }
    setPreview(parsed)
    setIgnoradas(ignoradas)
    setStep('preview')
  }

  async function handleImport() {
    setLoading(true)
    const res = await importarEmpresas(preview)
    setResult(res)
    setStep('done')
    setLoading(false)
  }

  const colOptions = [
    { value: -1, label: '— não usar —' },
    ...headers.map((h, i) => ({ value: i, label: `Col ${String.fromCharCode(65 + i)}: ${h || '(sem nome)'}` })),
  ]

  const CAMPOS: { key: keyof ColMap; label: string; required?: boolean }[] = [
    { key: 'empresa',               label: 'EMPRESA',                       required: true },
    { key: 'cnpj',                  label: 'CNPJ' },
    { key: 'responsavel',           label: 'RESPONSÁVEL' },
    { key: 'auxiliar',              label: 'Auxiliar' },
    { key: 'responsavel_finalizar', label: 'RESPONSÁVEL POR FINALIZAR 2025' },
    { key: 'situacao',              label: 'SITUAÇÃO DAS EMPRESAS' },
    { key: 'prioridade',            label: 'PRIORIDADES' },
    { key: 'prazo',                 label: 'PRAZO' },
    { key: 'ecd',                   label: 'ECD' },
    { key: 'ecf',                   label: 'ECF' },
  ]

  return (
    <div className="space-y-6">

      {step === 'upload' && (
        <div className="bg-white rounded-xl shadow p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Selecione o arquivo</h3>
            <p className="text-sm text-gray-500 mb-6">Suporta Excel (.xlsx, .xls) e CSV (.csv)</p>
            <label className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg cursor-pointer transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Escolher arquivo
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </label>
          </div>

          {/* Referência de colunas */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Colunas reconhecidas automaticamente (na ordem da planilha):</p>
            <div className="overflow-x-auto">
              <table className="text-xs text-gray-600 border-collapse w-full">
                <thead>
                  <tr className="bg-amber-50">
                    {[
                      'RESPONSÁVEL','Auxiliar','RESPONSÁVEL POR FINALIZAR 2025',
                      'SITUAÇÃO DAS EMPRESAS','PRIORIDADES','PRAZO',
                      'EMPRESA','CNPJ','ECD','ECF',
                    ].map((h, i) => (
                      <th key={i} className={`border border-gray-300 px-2 py-1 text-left whitespace-nowrap ${h === 'EMPRESA' || h === 'CNPJ' ? 'bg-blue-100 font-bold' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[
                      'RODRIGO','MICHELI','RODRIGO','ATIVA','ALTA','31/12/2025',
                      'EMPRESA MODELO LTDA','12.345.678/0001-99','PENDENTE','PENDENTE',
                    ].map((v, i) => (
                      <td key={i} className="border border-gray-300 px-2 py-1 whitespace-nowrap">{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              As colunas são detectadas pelo nome — a ordem não importa. Colunas não reconhecidas (Plano de Contas, VOLUME, TRIBUTAÇÃO) são ignoradas.
            </p>
          </div>
        </div>
      )}

      {step === 'map' && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Verificar mapeamento de colunas</h3>
              <p className="text-sm text-gray-500">{rows.length} linhas detectadas</p>
            </div>
            {autoDetected && (
              <span className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Colunas detectadas automaticamente
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {CAMPOS.map(({ key, label, required }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                  {colMap[key] >= 0 && (
                    <span className="ml-2 text-green-600 font-normal">
                      ✓ Col {String.fromCharCode(65 + colMap[key])}
                    </span>
                  )}
                </label>
                <select
                  value={colMap[key]}
                  onChange={e => setColMap(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                    required && colMap[key] < 0 ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {colOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Preview das primeiras linhas */}
          {headers.length > 0 && (
            <div className="mb-5 overflow-x-auto border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 px-3 pt-2 pb-1 bg-gray-50 border-b border-gray-200">
                Primeiras 3 linhas da planilha:
              </p>
              <table className="text-xs text-gray-700 w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {headers.map((h, i) => (
                      <th key={i} className="border-r border-gray-200 px-2 py-1.5 text-left whitespace-nowrap font-semibold">
                        {String.fromCharCode(65 + i)}: {h || '—'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((row, ri) => (
                    <tr key={ri} className="border-t border-gray-100">
                      {row.map((cell, ci) => (
                        <td key={ci} className="border-r border-gray-200 px-2 py-1 max-w-[120px] truncate">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={buildPreview}
              disabled={colMap.empresa < 0}
              className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition"
            >
              Pré-visualizar →
            </button>
            <button
              onClick={() => { setStep('upload'); setRows([]); setHeaders([]) }}
              className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm transition"
            >
              Voltar
            </button>
          </div>
          {colMap.empresa < 0 && (
            <p className="text-xs text-red-500 mt-2">
              O campo EMPRESA é obrigatório. Verifique se o cabeçalho está correto.
            </p>
          )}
        </div>
      )}

      {step === 'preview' && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Confirmar importação</h3>
              <p className="text-sm text-gray-500">{preview.length} empresas prontas para importar</p>
              {ignoradas > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">
                  {ignoradas} linha(s) ignorada(s) por não ter nome de empresa.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('map')}
                className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm transition"
              >
                Ajustar
              </button>
              <button
                onClick={handleImport}
                disabled={loading || preview.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold px-6 py-2 rounded-lg text-sm transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Importando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Importar {preview.length} empresas
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs text-gray-700">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">#</th>
                  <th className="px-3 py-2 text-left font-semibold">Empresa</th>
                  <th className="px-3 py-2 text-left font-semibold">CNPJ</th>
                  <th className="px-3 py-2 text-left font-semibold">Responsável</th>
                  <th className="px-3 py-2 text-left font-semibold">Situação</th>
                  <th className="px-3 py-2 text-left font-semibold">Prioridade</th>
                  <th className="px-3 py-2 text-left font-semibold">ECD</th>
                  <th className="px-3 py-2 text-left font-semibold">ECF</th>
                  <th className="px-3 py-2 text-left font-semibold">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((emp, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-800 max-w-[200px] truncate">{emp.empresa}</td>
                    <td className="px-3 py-2 font-mono">{emp.cnpj}</td>
                    <td className="px-3 py-2">{emp.responsavel || '—'}</td>
                    <td className="px-3 py-2">{emp.situacao_empresa || '—'}</td>
                    <td className="px-3 py-2">{emp.prioridade || '—'}</td>
                    <td className="px-3 py-2">{emp.ecd_status || '—'}</td>
                    <td className="px-3 py-2">{emp.ecf_status || '—'}</td>
                    <td className="px-3 py-2">{emp.prazo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${result.errors.length === 0 ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <svg className={`w-8 h-8 ${result.errors.length === 0 ? 'text-green-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Importação concluída!</h3>
          <div className="flex items-center justify-center gap-8 my-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{result.ok}</p>
              <p className="text-sm text-gray-500">Importadas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-400">{result.skip}</p>
              <p className="text-sm text-gray-500">Ignoradas</p>
            </div>
            {result.errors.length > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{result.errors.length}</p>
                <p className="text-sm text-gray-500">Erros</p>
              </div>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 text-left bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm font-semibold text-red-700 mb-2">Erros:</p>
              {result.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
            </div>
          )}
          <a
            href="/dashboard/empresas"
            className="inline-flex items-center gap-2 mt-6 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg text-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Ver Empresas
          </a>
        </div>
      )}
    </div>
  )
}
