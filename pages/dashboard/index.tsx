// Style imports
import styles from '@/styles/Dashboard.module.scss';

// Image imports
import arrow from '@/images/icons/arrow_upward.svg'
import vector from '@/images/elements/author-box-vector.svg';
import pattern from '@/images/elements/pattern.svg';

import { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { DefaultHead } from "@/components/DefaultHead";
import { DashboardBox } from "@/components/dashboard/Box";
import { useUser } from '@/components/Context';
import { getFirstName } from '@/lib/utils';
import { DashboardArticles } from '@/components/dashboard/Articles';

function Dashboard() {
  const data = useUser();
  const avatar = data?.user?.image_url || vector.src;

  return (
    <div>
      <DefaultHead title="Dashboard" />
      <Navbar />
      <MainLayout>
        <div className={styles.header}>
          <DashboardBox className={styles.userBox}>
            <img className={styles.userBoxVector} src={avatar} alt="" />
            <div>
              <p className={`nm text size-24 weight-600 gray-800`}>Hello, {getFirstName(data?.user?.name)}</p>
              <a
                href={`https://wordcelclub.com/${data?.user?.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="nm text size-20 weight-500 gray-400 mt-0-5 underline gap"
              >
                wordcel.club/{data?.user?.username}
              </a>
            </div>
            <img className={styles.authorBoxPattern} src={pattern.src} alt="" />
          </DashboardBox>
          <DashboardBox className={styles.learnBox}>
            <p className="nm text size-24 weight-600 gray-800">Learn about Wordcel</p>
            <p className="nm text size-20 weight-500 gray-400 mt-0-5">Helpful articles to explore</p>
            <a className={styles.readButton} href="/wordcelclub.sol" target="_blank" rel="noopener noreferrer">
              <img src={arrow.src} alt="" />
              Read Articles
            </a>
          </DashboardBox>
        </div>
        <DashboardArticles />
      </MainLayout>
    </div>
  );
}

export default Dashboard;