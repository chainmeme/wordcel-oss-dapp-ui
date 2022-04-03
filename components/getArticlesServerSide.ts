import prisma from '@/lib/prisma';

export const getArticlesServerSide = async (context: any) => {
  const public_key = context.query.publicKey as string;
  const user = await prisma.user.findFirst({ where: {
    public_key
  }});
  if (!user) {
    return {
      redirect: {
        permanent: false,
        destination: 'https://tally.so/r/w2d59m'
      },
      props: {}
    }
  };
  const articles = await prisma.article.findMany({
    where: {
      user_id: user.id
    }
  })
  return {
    props: {
      articles,
      user
    }
  }
}