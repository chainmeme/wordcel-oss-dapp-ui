// Component Imports
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { EditorCore } from "@react-editor-js/core";
import {
  useCallback,
  useRef,
  useState,
  useEffect
} from 'react';
import { useRouter } from 'next/router';
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { publishPost } from '@/lib/contractInteraction';
import { getUserSignature } from '@/lib/signMessage';
import { deleteDraft, updateDraft } from '@/lib/networkRequests';

// Layout Imports
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { DefaultHead } from "@/components/DefaultHead";


function Dashboard() {
  const router = useRouter();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const { publicKey, signMessage } = useWallet();
  const Editor: any = dynamic(() => import('@/components/Editor'), {
    ssr: false
  });
  const editorInstance = useRef<EditorCore | null>(null);
  const handleInitialize = useCallback((instance) => {
    editorInstance.current = instance
  }, []);
  const [signature, setSignature] = useState<Uint8Array>();
  const [shareHash, setShareHash] = useState('');

  let [draft_id] = useState('');
  let [publishClicked] = useState(false);

  const handlePublish = async () => {
    if (!anchorWallet || publishClicked) return;
    publishClicked = true;
    const savedContent = await editorInstance.current?.save();
    if (!savedContent || !signMessage || !publicKey) return;
    const signature = await getUserSignature(signMessage, publicKey.toBase58());
    if (!signature) return;
    const payload = {
      content: { blocks: savedContent.blocks },
      type: 'blocks'
    };
    console.log(payload);
    const response = await publishPost(
      payload,
      anchorWallet as any,
      wallet,
      signature,
      undefined,
      true
    );
    deleteDraft({
      id: draft_id?.toString(),
      signature: signature,
      public_key: wallet.publicKey?.toBase58()
    });
    if (!response.article) return;
    toast('Redirecting...');
    router.push(`/${response.username}/${response.article.slug}`);
  };

  // Get User's Signature for auto saving drafts
  useEffect(() => {
    (async function () {
      if (publicKey && signMessage) {
        const userSignature = await getUserSignature(
          signMessage,
          publicKey.toBase58(),
          true
        );
        if (userSignature) setSignature(userSignature);
      }
    })();
  }, []);

  // Auto save the draft
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!editorInstance.current?.save || !publicKey || !signature || publishClicked) return;
      const data = await editorInstance.current.save();
      const response = await updateDraft({
        id: draft_id,
        blocks: data.blocks,
        signature: signature,
        public_key: publicKey.toBase58()
      });
      console.log(response);
      if (response?.draft?.id) draft_id = response.draft.id;
      if (response?.draft?.share_hash) setShareHash(response.draft.share_hash);
    }, 8000);
    return () => {
      clearInterval(interval);
    }
  }, [signature]);

  const handleShareDraft = () => {
    if (shareHash) {
      navigator.clipboard.writeText('https://wordcelclub.com/draft/' + shareHash);
      toast.success('Draft link copied to clipboard');
    }
  }

  return (
    <div>
      <DefaultHead title="Dashboard • Publish New Article" />
      <Navbar
        publish={handlePublish}
        shareDraft={shareHash ? handleShareDraft : undefined}
      />
      <MainLayout>
        <div className="mt-5">
          <Editor handleInstance={handleInitialize} instance={editorInstance} />
        </div>
      </MainLayout>
      <Footer />
    </div>
  );
}

export default Dashboard;