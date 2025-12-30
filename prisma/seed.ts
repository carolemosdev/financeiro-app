// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Cria um usuário de teste se não existir
  const user = await prisma.user.upsert({
    where: { email: 'teste@financas.com' },
    update: {},
    create: {
      email: 'teste@financas.com',
      name: 'Usuário Desenvolvedor',
      riskProfile: 'MODERADO',
    },
  })
  console.log({ user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })