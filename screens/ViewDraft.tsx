import date from 'date-and-time';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import styles from '@/styles/Reader.module.scss';
import editorStyles from '@/styles/Editor.module.scss';
import userStyles from '@/styles/UserView.module.scss';
import gradient from '@/images/gradients/reader.png';
import gradient2 from '@/images/gradients/reader-2.png'
import { GetDraftServerSide } from '@/types/props';
import { useEffect, useState } from 'react';
import { DefaultHead } from '../components/DefaultHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getReadingTime } from '@/lib/getReadingTime';
import { useRouter } from 'next/router';
import { NotFoundElement } from '@/components/404';
import { getTrimmedPublicKey } from '@/lib/getTrimmedPublicKey';

export const AuthorBox = (props: GetDraftServerSide) => {
  const Name = props.user?.name;
  const Bio = props.user?.bio;
  const Avatar = props.user?.image_url || `https://avatars.wagmi.bio/${props.user?.name}`;

  return (
    <div className={styles.authorBox}>
      <div className="flex height-100 align-items-center">
        <img
          src={Avatar}
          className={userStyles.avatar}
          alt={props.user?.username}
        />
        <div className="ml-2">
          <p className="text size-16 weight-600 gray-400 nm mt-2 mb-0-5">ABOUT THE AUTHOR</p>
          <Link href={`/${props.user?.username}`}>
            <a>
              <p className="text gray-700 weight-700 size-28 nm-bottom nm-top">{Name}</p>
            </a>
          </Link>
          {props.user && (
            <p className="text size-16 weight-500 gray-400 nm">{props.user?.username} • {getTrimmedPublicKey(props.user.public_key)}</p>
          )}
          {Bio && (
            <p className="normal-text sm nm-bottom mt-1">{Bio}</p>
          )}
        </div>
      </div>
    </div>
  );
};


const Gradients = () => {
  return (
    <>
      <img className={styles.topLeftGradient} src={gradient.src} alt="" />
      <img className={styles.bottomRightGradient} src={gradient2.src} alt="" />
    </>
  );
}

export const ViewDraft = (props: GetDraftServerSide) => {
  const { asPath } = useRouter();
  const [blocks] = useState<any>(JSON.parse(props.draft?.blocks ? props.draft?.blocks : "[]"));
  const Reader: any = dynamic(() => import('@/components/Reader'), {
    ssr: false
  });
  const SEOData = {
    title: props.draft?.title,
    name: props.user?.name,
    image: props.user?.image_url
  };
  const base64Data = Buffer.from(JSON.stringify(SEOData)).toString('base64');
  const SEOImage = props.draft?.image_url || `https://d3ztzybo1ne7w.cloudfront.net/article/${encodeURIComponent(base64Data)}`;

  const readingTime = getReadingTime(blocks);

  const insertAfter = (newNode: Node, existingNode: Node) => {
    existingNode.parentNode?.insertBefore(
      newNode,
      existingNode.nextSibling
    );
  }

  useEffect(() => {
    setTimeout(() => {
      const firstElement = document.getElementById('reader')?.firstElementChild;
      if (firstElement && props.draft) {
        const div = document.getElementById('reader-article-details');
        if (!div) return;
        document.getElementById('reader-article-details-parent')?.removeChild(div);
        insertAfter(div, firstElement);
      }
    }, 500)
  }, []);

  const ArticleDetails = () => {
    if (!props.draft) return <></>;
    const created_at = new Date(props.draft.created_at);
    const formatted_date = date.format(created_at, 'DD MMM, YYYY');
    return (
      <div id="reader-article-details-parent">
        <div id="reader-article-details">
          <div className={styles.readerBasicAuthorBox}>
            <Link href={`/${props.user?.username}`}>
              <a>
                <img
                  className={styles.readerAuthorImage}
                  src={props.user?.image_url}
                  alt=""
                />
              </a>
            </Link>
            <div>
              <Link href={`/${props.user?.username}`}>
                <a>
                  <p className="text gray-600 size-16 weight-600 nm">{props.user?.username}</p>
                </a>
              </Link>
              <p className="reader-paragraph nm">{formatted_date} • {readingTime} read</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-flex">
      <DefaultHead
        title={props.draft?.title}
        description={props.draft?.description}
        author={props.user?.name}
        blog_name={props.user?.blog_name}
        url={`https://wordcelclub.com/${asPath}`}
        image={SEOImage}
      />
      <Navbar />
      <Gradients />
      {blocks.length > 0 && (
        <div className={editorStyles.container}>
          <div
            style={{ display: 'flex', justifyContent: 'center' }}
            className={editorStyles.editorMaxWidth}>
            {typeof window !== 'undefined' && (
              <div className="reader-max-width">
                <ArticleDetails />
                <Reader blocks={blocks} />
                <AuthorBox {...props} />
              </div>
            )}
          </div>
        </div>
      )}

      {blocks.length === 0 && (
        <NotFoundElement />
      )}

      <Footer />
    </div>
  );
};
