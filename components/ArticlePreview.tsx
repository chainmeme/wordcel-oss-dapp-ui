import Link from 'next/link';
import date from 'date-and-time';
import styles from '@/styles/UserView.module.scss';
import editArticle from '@/images/elements/edit-article.svg';

// Tags
import publishedTag from '@/images/tags/published.svg';
import draftTag from '@/images/tags/draft.svg';
import uploadedTag from '@/images/tags/uploaded.svg';

import { User } from '@prisma/client';
import { Article, Draft } from '@/types/props';
import { shortenSentence } from '@/lib/sanitize';
import { useRouter } from 'next/router';

export const ArticlePreview = ({
  article,
  user
}: {
  article: Article;
  user: User | undefined;
}) => {
  const router = useRouter();
  const SEOData = {
    title: article.title,
    name: user?.name,
    image: user?.image_url
  };
  const base64Data = Buffer.from(JSON.stringify(SEOData)).toString('base64');
  const DefaultImage = `https://og.up.railway.app/article/${encodeURIComponent(base64Data)}`;
  return (
    <div className={styles.articleContainer}>
      <Link href={`/${user?.username}/${article.slug}`}><a>
        <p className="heading md nm pointer">{article.title}</p>
      </a></Link>
      <div>
        <p>
          <span className="normal-text cursive-text">
            {shortenSentence(article.description)}
          </span>
          <Link href={`/${user?.username}/${article.slug}`}><a>
            <span className="blue-text pointer ml-1 op-1">
              READ MORE
            </span>
          </a></Link>
        </p>
      </div>
      <img className={styles.articleImage} src={article.image_url || DefaultImage} />
    </div>
  );
};

export const VerticalArticlePreview = ({
  article,
  user
}: {
  article: Article | Draft;
  user: User | null;
}) => {
  const router = useRouter();
  const created_at = new Date(article.created_at);
  const formatted_date = date.format(created_at, 'DD MMM YYYY');
  const SEOData = {
    title: article.title,
    name: user?.name,
    image: user?.image_url
  };
  const base64Data = Buffer.from(JSON.stringify(SEOData)).toString('base64');
  const DefaultImage = `https://og.up.railway.app/article/${encodeURIComponent(base64Data)}`;
  const isNotDraft = 'slug' in article;

  return (
    <div className={styles.verticalContainer}>
      <div className={styles.verticalPreview}>
        <img src={article.image_url || DefaultImage} className={styles.verticalImage} />
        <div className={styles.verticalArticleText}>
          <p
            onClick={() => {
              if (isNotDraft) {
                router.push(`/${user?.username}/${article.slug}`)
              }
            }}
            className={`text gray-600 weight-600 size-20 nm ${isNotDraft ? 'pointer' : ''}`}>{shortenSentence(article.title, 75)}</p>
          <p className="text size-16 weight-500 gray-400 nm mt-1">
            {shortenSentence(article.description, 112)}
          </p>
        </div>
      </div>
      <div className={styles.verticalArticleAdditional}>
        {isNotDraft && (
          <img className={styles.onChainTag} src={article.on_chain ? publishedTag.src : uploadedTag.src} alt="" />
        )}
        {!isNotDraft && (
          <img className={styles.draftsTag} src={draftTag.src} alt="" />
        )}
        <p className="text size-16 weight-500 gray-400">{formatted_date}</p>
        <img
          onClick={() => {
            if (isNotDraft) {
              router.push(`/dashboard/edit/${user?.username}/${article.slug}`)
            } else {
              router.push(`/dashboard/edit/draft/${article.id}`)
            }
          }}
          className={styles.editArticle}
          src={editArticle.src}
          alt="Edit Article"
        />
      </div>
    </div>
  );
};
