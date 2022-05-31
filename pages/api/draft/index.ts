import prisma from '@/lib/prisma';
import type {
  NextApiRequest,
  NextApiResponse,
} from 'next';
import {
  verifyKeys,
  verifyMethod,
  authenticate
} from '@/lib/server';
import { getHeaderContent } from '@/components/getHeaderContent';
import { sanitizeHtml } from '@/lib/sanitize';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const allowed = verifyMethod(req, res, 'POST');
  if (!allowed) return;
  try {
    const requiredKeys = ['public_key', 'signature', 'blocks'];
    const allKeysPresent = verifyKeys(req, res, requiredKeys);
    if (!allKeysPresent) return;

    const {
      public_key,
      signature,
      blocks,
      id
    } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        public_key,
      }
    });

    if (!user) {
      res.status(400).json({
        error: 'User does not exist'
      });
      return;
    }

    const authenticated = authenticate(public_key, signature, res);
    if (!authenticated) return;

    const {
      title,
      description,
      image_url
    } = getHeaderContent(blocks);

    if (id) {
      const existing_draft = await prisma.draft.findFirst({
        where: {
          id: Number(id),
          owner: {
            id: user.id
          }
        }
      });

      if (!existing_draft) {
        res.status(400).json({
          error: 'Draft does not exist'
        });
        return;
      }

      let blocks_id;

      const existing_blocks = await prisma.block.findFirst({
        where: {
          draft_id: existing_draft.id
        }
      });

      if (existing_blocks) {
        blocks_id = existing_blocks?.id;
      }

      if (!existing_blocks) {
        const new_blocks = await prisma.block.create({
          data: {
            data: JSON.stringify(blocks),
            draft_id: existing_draft.id
          }
        });
        blocks_id = new_blocks.id;
      }

      const updated = await prisma.draft.update({
        where: { id: Number(id) },
        data: {
          title: sanitizeHtml(title),
          description: sanitizeHtml(description),
          image_url: sanitizeHtml(image_url),
        }
      });

      const updated_blocks = await prisma.block.update({
        where: { id: blocks_id },
        data: {
          data: JSON.stringify(blocks),
        }
      });

      res.status(200).json({
        success: 'Draft updated',
        draft: updated,
        username: user.username
      });
      return
    }

    const newDraft = await prisma.draft.create({
      data: {
        title: sanitizeHtml(title),
        description: sanitizeHtml(description),
        image_url,
        owner: {
          connect: {
            id: user.id
          }
        }
      }
    });

    const newBlocks = await prisma.block.create({
      data: {
        data: JSON.stringify(blocks),
        draft_id: newDraft.id
      }
    });

    res.status(200).json({
      success: 'Draft created',
      draft: newDraft,
      username: user.username
    });

  } catch (e) {
    console.error('Request error', e);
    res.status(500).json({
      error: 'Error updating/creating draft',
    });
  }
}