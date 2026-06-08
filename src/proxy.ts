import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

const publicRoutes = ['/login']
const authRoutes = ['/alterar-senha']

const adminRoutes = [
  '/dashboard/usuarios',
  '/dashboard/configuracoes',
]

const permissaoRoutes: Record<string, string> = {
  '/dashboard/empresas': 'empresas',
  '/dashboard/obrigacoes': 'obrigacoes',
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.includes(pathname)

  const token = request.cookies.get('session')?.value
  const session = await decrypt(token)

  if (!session?.userId) {
    if (isPublicRoute || isAuthRoute) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (session.primeiro_acesso && !isAuthRoute) {
    return NextResponse.redirect(new URL('/alterar-senha', request.url))
  }

  const isAdmin = session.perfil === 'ADMINISTRADOR'

  const isAdminRoute = adminRoutes.some(r => pathname.startsWith(r))
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!isAdmin) {
    for (const [route, perm] of Object.entries(permissaoRoutes)) {
      if (pathname.startsWith(route) && !session.permissoes?.includes(perm)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
