export interface PublishArticleRequest {
  id: string | undefined;
  arweave_url: string;
  public_key: string;
  signature: Uint8Array;
  proof_of_post: string;
}

export interface Subscribe {
  account: string;
  publication_owner: string;
  public_key: string;
  signature: Uint8Array;
}

export interface UpdateCache {
  id: string | undefined;
  cache_link: string;
  public_key: string;
  signature: Uint8Array;
}

export interface UpdatableUserDetails {
  name?: string;
  bio?: string;
  blog_name?: string;
  image_url?: string;
  twitter?: string;
  discord?: string;
}

export interface UpdateUser extends UpdatableUserDetails {
  public_key: string;
  signature: Uint8Array;
}