import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export type SessionPayload = {
  userId: string
  nome: string
  perfil: 'ADMINISTRADOR' | 'USUARIO'
  primeiro_acesso: boolean
  permissoes: string[]
  expiresAt: Date
}

const secretKey = process.env.SESSION_SECRET
if (!secretKey) throw new Error('SESSION_SECRET não definida nas variáveis de ambiente.')
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(token: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ['HS256'] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(data: Omit<SessionPayload, 'expiresAt'>) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ ...data, expiresAt })
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function updateSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  const payload = await decrypt(token)
  if (!token || !payload) return null

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  return await decrypt(token)
}
