import prisma from '@/lib/prisma';
import type {
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { withSentry } from '@sentry/nextjs';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { arweave_url } = req.query;
  const article = await prisma.article.findFirst({
    where: {
      arweave_url: arweave_url as string,
    },
    select: {
      slug: true,
      owner: {
        select: {
          username: true,
        },
      }
    },
  });

  if (!article) {
    res.status(404).json({ message: 'Article not found' });
    return;
  } else {
    res.status(200).json({ articleLink: `${article.owner.username}/${article.slug}`});
  }
};

export default withSentry(handler);