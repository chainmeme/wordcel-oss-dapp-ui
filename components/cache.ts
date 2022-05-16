import { NewArticleCache, UpdateCache } from '@/types/api';

export const updateCacheLink = async (
  data: UpdateCache
) => {
  const request = await fetch(
    '/api/cache/update',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const response = await request.json();
  return response;
};

export async function createNewCache(
  data: NewArticleCache
) {
  const request = await fetch(
    '/api/publish/new/cache',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const response = await request.json();
  return response;
}