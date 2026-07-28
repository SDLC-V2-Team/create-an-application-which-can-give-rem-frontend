import { PrismaClient, Category } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Example reminders
  const reminders = [
    {
      userId: 1,
      title: 'Alice Birthday',
      description: 'Buy gift for Alice',
      category: Category.birthdays,
    },
    {
      userId: 1,
      title: 'Team standup',
      description: 'Daily standup at 10am',
      category: Category.work,
    },
    {
      userId: 1,
      title: 'Picnic with friends',
      description: 'Bring snacks',
      category: Category.casual,
    },
    {
      userId: 1,
      title: 'Grocery shopping',
      description: 'Buy milk and eggs',
      category: Category.other,
    },
  ];

  for (const reminder of reminders) {
    await prisma.reminder.create({ data: reminder });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
