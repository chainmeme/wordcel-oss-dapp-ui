import * as anchor from '@project-serum/anchor';
import randombytes from 'randombytes';
import toast from 'react-hot-toast';
import idl from '@/components/config/devnet-idl.json';
import { SystemProgram, PublicKey } from '@solana/web3.js';
import { ContentPayload } from '@/components/upload';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { uploadBundle } from '@/components/uploadBundlr';
import { ENDPOINT } from './config/constants';
import {
  addProfileHash,
  publishToServer,
  updateSubscriptionServer,
  getProfileHash
} from '@/components/networkRequests';

const preflightCommitment = "processed";
const programID = new anchor.web3.PublicKey(idl.metadata.address);
const connection = new anchor.web3.Connection(ENDPOINT, preflightCommitment);

const provider = (wallet: anchor.Wallet) => new anchor.Provider(
  connection,
  wallet,
  { preflightCommitment }
);

export async function getProfileKeyAndBump(
  profileSeeds: Buffer[],
  program: anchor.Program
) {
  return await anchor.web3.PublicKey.findProgramAddress(
    profileSeeds,
    program.programId
  );
}

async function createProfileAccount(
  profileSeeds: Buffer[],
  profileHash: Buffer,
  user: PublicKey,
  program: anchor.Program
) {
  const [profileKey] = await anchor.web3.PublicKey.findProgramAddress(
    profileSeeds,
    program.programId
  );
  await program.rpc.initialize(profileHash, {
    accounts: {
      profile: profileKey,
      user: user,
      systemProgram: SystemProgram.programId,
    }
  });
  return profileKey;
}

export async function publishPost(
  data: ContentPayload,
  wallet: anchor.Wallet,
  adapterWallet: WalletContextState,
  signature: Uint8Array,
  id?: string | number,
  getResponse?: boolean,
  published_post = ''
) {
  toast.loading('Loading configurations');
  const program = new anchor.Program(idl as anchor.Idl, programID, provider(wallet));
  const existingHash = await getProfileHash(wallet.publicKey.toBase58());
  const profileHash = existingHash ? Buffer.from(existingHash, 'base64') : randombytes(32);

  const profileSeeds = [Buffer.from("profile"), profileHash];
  const profileKeyAndBump = await getProfileKeyAndBump(
    profileSeeds,
    program
  );
  const profileKey = profileKeyAndBump[0];
  toast.dismiss();

  try {
    const profileAccount = await program.account.profile.fetch(profileKey);
    console.log(profileAccount);
  } catch (e) {
    toast('Profile does not exist, creating one');
    const newProfileAccount = await createProfileAccount(
      profileSeeds,
      profileHash,
      wallet.publicKey,
      program
    );
    if (!newProfileAccount) {
      throw new Error(`Profile creation failed`);
    };
    if (!existingHash) {
      const profile_hash_req = await addProfileHash({
        public_key: wallet.publicKey.toBase58(),
        signature: signature,
        profile_hash: profileHash.toString('base64')
      });
      if (!profile_hash_req.user) {
        throw new Error(`Profile hash save failed`);
      }
    }
    console.log(newProfileAccount);
  }

  const postHash = randombytes(32);
  const postSeeds = [Buffer.from("post"), postHash];
  const [postAccount] = await anchor.web3.PublicKey.findProgramAddress(postSeeds, program.programId);

  toast.loading('Uploading');
  let metadataURI = '';
  try {
    metadataURI = await uploadBundle(
      data,
      adapterWallet
    );
  } catch (e: any) {
    console.log(e);
  }
  toast.dismiss();
  if (!metadataURI) {
    toast.error('Upload failed');
    throw new Error('Upload failed');
  };
  toast.success('Uploaded');
  console.log(`Arweave URI: ${metadataURI}`);
  let txid;
  if (published_post) {
    txid = await program.rpc.updatePost(metadataURI, {
      accounts: {
        post: new PublicKey(published_post),
        profile: profileKey,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }
    });
    console.log(`update tx: ${txid}`);
  } else {
    txid = await program.rpc.createPost(metadataURI, postHash, {
      accounts: {
        post: postAccount,
        profile: profileKey,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId
      },
    });
  }
  try {
    if (!txid) {
      throw new Error('Transaction creation failed');
    };
    const confirmation = connection.confirmTransaction(txid, preflightCommitment);
    toast.promise(confirmation, {
      loading: 'Confirming Transaction',
      success: 'Article Published',
      error: 'Transaction Failed'
    });
    const verified = await confirmation;
    if (verified.value.err !== null) {
      throw new Error('Transaction confirmation failed');
    };
    toast.loading('Saving');
    const saved = await publishToServer({
      id: id?.toString(),
      arweave_url: metadataURI,
      public_key: wallet.publicKey.toString(),
      signature: signature,
      proof_of_post: published_post || postAccount.toBase58(),
    });
    toast.dismiss();
    if (saved && !getResponse) return txid;
    if (saved && getResponse) return saved;
  } catch (e) {
    console.log(e);
    return;
  }
}

export async function initializeSubscriberAccount(
  wallet: anchor.Wallet,
) {
  const program = new anchor.Program(idl as anchor.Idl, programID, provider(wallet));
  const subscriberSeeds = [Buffer.from("subscriber"), wallet.publicKey.toBuffer()];
  const [subscriberKey] = await anchor.web3.PublicKey.findProgramAddress(
    subscriberSeeds,
    program.programId
  );
  const txid = await program.rpc.initializeSubscriber({
    accounts: {
      subscriber: subscriberKey,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId
    }
  });
  console.log(`Subscriber Account Creation: ${txid}`);
  return subscriberKey;
};

export async function subscribeToProfile (
  wallet: anchor.Wallet,
  profileOwner: PublicKey,
  setSubscribed: (subscribed: boolean) => void,
  signature: Uint8Array
) {
  const program = new anchor.Program(idl as anchor.Idl, programID, provider(wallet));
  const subscriberSeeds = [Buffer.from("subscriber"), wallet.publicKey.toBuffer()];
  const existingHash = await getProfileHash(profileOwner.toBase58());

  if (!existingHash) {
    toast.error('Profile hash not found');
    return;
  }

  const profileSeeds = [Buffer.from("profile"), existingHash];
  const [subscriberKey] = await anchor.web3.PublicKey.findProgramAddress(
    subscriberSeeds,
    program.programId
  );
  let subscriberAccount;

  try {
    subscriberAccount = await program.account.subscriber.fetch(subscriberKey);
  } catch (e) {
    console.log('Subscriber account does not exist');
    const newSubscriberAccount = await initializeSubscriberAccount(wallet);
    if (!newSubscriberAccount) {
      toast.error('Subscriber account creation failed');
      throw new Error(`Subscriber account creation failed`);
    }
    subscriberAccount = newSubscriberAccount;
  }

  const [profileKey] = await anchor.web3.PublicKey.findProgramAddress(
    profileSeeds,
    program.programId
  );
  const subcriptionSeeds = [Buffer.from("subscription"), subscriberKey.toBuffer(), new anchor.BN(subscriberAccount.subscriptionNonce).toArrayLike(Buffer)];
  const [subscriptionKey] = await anchor.web3.PublicKey.findProgramAddress(
    subcriptionSeeds,
    program.programId
  );
  const tx = await program.transaction.initializeSubscription({
    accounts: {
      subscriber: subscriberKey,
      subscription: subscriptionKey,
      authority: wallet.publicKey,
      profile: profileKey,
      systemProgram: SystemProgram.programId
    }
  });
  const { blockhash } = await connection.getRecentBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;
  const signedTx = await wallet.signTransaction(tx);
  const txid = await connection.sendRawTransaction(signedTx.serialize());
  if (!txid) {
    throw new Error('Transaction creation failed');
  };
  const confirmation = connection.confirmTransaction(txid, preflightCommitment);
  toast.promise(confirmation, {
    loading: 'Confirming Transaction',
    success: 'Transaction Confirmed',
    error: 'Transaction Failed'
  });
  const verified = await confirmation;
  if (verified.value.err !== null) {
    throw new Error('Transaction failed')
  };
  toast.loading('Saving')
  const saved = await updateSubscriptionServer({
    account: subscriptionKey.toBase58(),
    profile_owner: profileOwner.toBase58(),
    public_key: wallet.publicKey.toString(),
    signature: signature,
  });
  toast.dismiss();
  if (saved.success) {
    setSubscribed(true);
    toast.success('Subscribed');
  }
}

export async function cancelSubscription(
  wallet: anchor.Wallet,
  profileOwner: PublicKey,
  subscriptionKey: PublicKey,
  setSubscribed: (subscribed: boolean) => void,
  signature: Uint8Array
) {
  const program = new anchor.Program(idl as anchor.Idl, programID, provider(wallet));
  const subscriberSeeds = [Buffer.from("subscriber"), wallet.publicKey.toBuffer()];
  const [subscriberKey] = await anchor.web3.PublicKey.findProgramAddress(
    subscriberSeeds,
    program.programId
  );
  const txid = await program.rpc.cancelSubscription({
    accounts: {
      subscriber: subscriberKey,
      subscription: subscriptionKey,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId
    }
  });
  if (!txid) {
    throw new Error('Transaction creation failed');
  };
  const confirmation = connection.confirmTransaction(txid, preflightCommitment);
  toast.promise(confirmation, {
    loading: 'Confirming Transaction',
    success: 'Transaction Confirmed',
    error: 'Transaction Failed'
  });
  const verified = await confirmation;
  if (verified.value.err !== null) {
    throw new Error('Transaction failed')
  };
  toast.loading('Saving');
  const saved = await updateSubscriptionServer({
    account: subscriptionKey.toBase58(),
    profile_owner: profileOwner.toBase58(),
    public_key: wallet.publicKey.toString(),
    signature: signature,
  }, true);
  toast.dismiss();
  if (saved.success) {
    setSubscribed(false);
    toast.success('Unsubscribed');
  } else {
    toast.error('Subscription cancellation failed');
  }
}