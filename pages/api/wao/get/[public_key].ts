import type {
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { withSentry } from '@sentry/nextjs';
import { getBagpackDomain } from '@/lib/networkRequests';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { public_key } = req.query;
  const owner_username = await getBagpackDomain(public_key as string);
  console.log(owner_username);
  if (!owner_username) {
    res.status(404).json({
      error: "User does not exist in the bagpack database"
    });
  }
  res.status(200).json({
    username: owner_username
  });
};

export default withSentry(handler);