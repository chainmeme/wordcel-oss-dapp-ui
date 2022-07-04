import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import styles from '@/styles/Editor.module.scss';
import { publishPost } from '@/components/contractInteraction';
import { EditorCore } from "@react-editor-js/core";
import { GetArticleServerSide } from '@/types/props';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import { useEffect, useCallback, useRef, useState } from 'react';
import { DefaultHead } from './DefaultHead';
import { StaticNavbar } from './Navbar';
import { getUserSignature } from '@/lib/signMessage';
import { Footer } from './Footer';

// @ts-expect-error
import Undo from 'editorjs-undo';
// @ts-expect-error
import DragDrop from 'editorjs-drag-drop';


export const EditArticle = (props: GetArticleServerSide) => {
  const wallet = useWallet();
  const router = useRouter();
  const anchorWallet = useAnchorWallet();
  const [blocks] = useState<any>(JSON.parse(props.blocks || ''));
  const { publicKey, signMessage } = useWallet();

  let [publishClicked] = useState(false);
  const Editor: any = dynamic(() => import('@/layouts/Editor'), {
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

  const handlePublish = async () => {
    if (!anchorWallet || !props.article || publishClicked) return;
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
      props.article?.id,
      true,
      props.article.proof_of_post,
      props.contentDigest
    );
    if (!response.article) {
      toast.dismiss();
      toast.error('Failed to publish article');
      return;
    };
    toast('Redirecting...');
    router.push(`/${response.username}/${response.article.slug}`);
  }

  useEffect(() => {
    if (!publicKey || publicKey.toString() !== props.user_public_key) {
      router.push('/');
    }
  }, [publicKey, props]);

  return (
    <div className="container-flex">
      <DefaultHead
        title={`Edit - ${props.article?.title}`}
        description={props.article?.description}
        image={props.article?.image_url}
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
