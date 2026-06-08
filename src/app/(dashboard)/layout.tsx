import { verifySession } from '@/lib/dal'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession()

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar perfil={session.perfil} permissoes={session.permissoes ?? []} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header nome={session.nome} perfil={session.perfil} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
