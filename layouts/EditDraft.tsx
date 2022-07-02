import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import styles from '@/styles/Editor.module.scss';
import { publishPost } from '@/components/contractInteraction';
import { EditorCore } from "@react-editor-js/core";
import { GetDraftServerSide } from '@/types/props';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import { useEffect, useCallback, useRef, useState } from 'react';
import { DefaultHead } from './DefaultHead';
import { StaticNavbar } from './Navbar';
import { saveToast } from '@/components/saveToast';
import { getUserSignature } from '@/lib/signMessage';
import { deleteDraft, updateDraft } from '@/components/networkRequests';
import { Footer } from './Footer';


export const EditDraft = (props: GetDraftServerSide) => {
  console.log(props);
  const wallet = useWallet();
  const router = useRouter();
  const anchorWallet = useAnchorWallet();
  const [blocks] = useState<any>(JSON.parse(props.draft?.blocks || ''));
  const [signature, setSignature] = useState<Uint8Array>();
  const { publicKey, signMessage } = useWallet();

  let [draft_id] = useState(props.draft?.id);
  let [publishClicked] = useState(false);

  const Editor: any = dynamic(() => import('@/layouts/Editor'), {
    ssr: false
  });

  // @ts-expect-error
  const Undo: any = dynamic(() => import('editorjs-undo'), {
    ssr: false
  });
  // @ts-expect-error
  const DragDrop: any = dynamic(() => import('editorjs-drag-drop'), {
    ssr: false
  });

  const editorInstance = useRef<EditorCore | null>(null);

  const handleInitialize = useCallback((instance) => {
    editorInstance.current = instance
  }, []);

  const handleReady = () => {
    // @ts-expect-error
    const editor = editorInstance?.current?._editorJS;
    const config = {
      shortcuts: {
        undo: 'CMD+Z',
        redo: 'SHIFT+Z'
      }
    }
    new Undo({ editor, config })
    new DragDrop(editor);
  };

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

  useEffect(() => {
    const eventListener = (e: KeyboardEvent) => {
      if (e.keyCode === 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        saveToast();
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener("keydown", eventListener);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener("keydown", eventListener);
      }
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!editorInstance.current?.save || !publicKey || !signature || publishClicked) return;
      const data = await editorInstance.current.save();
      const response = await updateDraft({
        id: draft_id?.toString(),
        blocks: data.blocks,
        signature: signature,
        public_key: publicKey.toBase58()
      });
      console.log(response);
      draft_id = response.draft.id;
    }, 8000)
    return () => {
      clearInterval(interval);
    }
  }, [signature]);

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
    const response = await publishPost(
      payload,
      anchorWallet as any,
      wallet,
      signature,
      undefined,
      true,
      undefined
    );
    if (!response.article) {
      toast.dismiss();
      toast.error('Failed to publish article');
      return;
    };
    deleteDraft({
      id: draft_id?.toString(),
      signature: signature,
      public_key: wallet.publicKey?.toBase58()
    });
    toast('Redirecting...');
    router.push(`/${response.username}/${response.article.slug}`);
  }

  useEffect(() => {
    if (!publicKey || publicKey.toString() !== props.user?.public_key) {
      router.push('/');
    }
  }, [publicKey, props]);

  return (
    <div className="container-flex">
      <DefaultHead
        title={`Edit - ${props.draft?.title}`}
        description={props.draft?.description}
        image={props.draft?.image_url}
      />
      <StaticNavbar publish={handlePublish} />
      <div className={styles.container}>
        <div className={styles.editorMaxWidth}>
          {typeof window !== 'undefined' && (
            <div className="mb-main">
              <Editor
                blocks={blocks}
                handleInstance={handleInitialize}
                handleReady={handleReady}
              />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};
