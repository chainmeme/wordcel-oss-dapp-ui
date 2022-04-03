import dynamic from 'next/dynamic';
import styles from '@/styles/Editor.module.scss';
import { uploadArweave } from '@/components/upload';
import { EditorCore } from "@react-editor-js/core";
import { GetArticleServerSide } from '@/types/props';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import { useEffect, useCallback, useRef, useState } from 'react';
import { DefaultHead } from './DefaultHead';
import { StaticNavbar } from './Navbar';
import toast from 'react-hot-toast';


export const EditArticle = (props: GetArticleServerSide) => {
  const router = useRouter();
  const [blocks, setBlocks] = useState<any>(JSON.parse(props.blocks || ''));
  const [headingBlocks, setHeadingBlocks] = useState<any>([
    { type: 'header', data: { level: '1', text: props.article?.title } },
    { type: 'paragraph', data: { text: props.article?.description } },
    { type: 'image', data: { url: props.article?.image_url } },
  ]);
  const { publicKey } = useWallet();

  let Editor = dynamic(() => import('@/layouts/Editor'), {
    ssr: false
  });
  let headerInstance = useRef<EditorCore | null>(null);
  let editorInstance = useRef<EditorCore | null>(null);

  const handleInitialize = useCallback((instance) => {
    editorInstance.current = instance
  }, []);

  const handleHeaderEditorInit = useCallback((instance) => {
    headerInstance.current = instance
  }, []);

  // Use this for publishing functions
  const handlePublish = async () => {
    const savedHeaderContent = await headerInstance.current?.save();
    const savedContent = await editorInstance.current?.save();
    if (!savedHeaderContent || !savedContent) return;
    const addedBlocks = [...savedHeaderContent.blocks, ...savedContent.blocks];
    const payload = {
      content: {
        blocks: addedBlocks
      },
      type: 'blocks'
    };
    const upload = uploadArweave(payload);
    toast.promise(upload, {
      loading: 'Uploading to Arweave',
      success: 'Uploaded Successfully!',
      error: 'Upload Failed!'
    })
    const uri = await upload;
    console.log(uri);
  }

  useEffect(() => {
    if (!publicKey || publicKey.toString() !== props.user_public_key) {
      router.push('/');
    }
  }, [publicKey, props]);

  return (
    <div>
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
                blocks={headingBlocks}
                handleInstance={handleHeaderEditorInit}
              />
              <Editor
                blocks={blocks}
                handleInstance={handleInitialize}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

