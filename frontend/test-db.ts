import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function test() {
  try {
    console.log('Testing hubMember query...');
    const joinedHubMemberships = await prisma.hubMember.findMany({
      take: 1
    });
    console.log('HubMember success:', joinedHubMemberships);

    console.log('Testing post creation...');
    const post = await prisma.post.create({
      data: {
        content: 'Test post',
        authorId: 'test-user', 
      }
    });
    console.log('Post success:', post);
  } catch (error) {
    console.error('Database Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
