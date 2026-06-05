import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminExistente = await prisma.usuario.findFirst({
    where: { OR: [{ usuario: 'admin' }, { email: 'admin@sistema.local' }] },
  })

  if (!adminExistente) {
    const senha_hash = await bcrypt.hash('admin123', 12)
    await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@sistema.local',
        usuario: 'admin',
        senha_hash,
        perfil: 'ADMINISTRADOR',
        status: 'ATIVO',
        primeiro_acesso: true,
      },
    })
    console.log('✅ Usuário administrador criado: admin / admin123')
    console.log('⚠️  Troque a senha no primeiro acesso!')
  } else {
    console.log('ℹ️  Usuário administrador já existe.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
