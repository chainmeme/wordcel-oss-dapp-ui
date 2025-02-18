import Link from 'next/link';
import logo from '@/images/logo.svg';
import styles from '@/styles/Footer.module.scss';
import TwitterIcon from '@/images/dynamic/Twitter';
import DiscordIcon from '@/images/dynamic/Discord';

const socials = [
  { link: 'https://twitter.com/wordcel_club', icon: TwitterIcon }, // REPLACE: Twitter link
  { link: 'https://discord.gg/tCswbSK5W2', icon: DiscordIcon }, // REPLACE: Discord link
];

export const Footer = () => {
  return (
    <div className={styles.container}>
      <div className={styles.center}>
        <div className={styles.heroSection}>
          <div className={styles.logoContainer}>
            <Link href="/">
              <a>
                <img className={styles.logo} src={logo.src} alt="Wordcel" />
              </a>
            </Link>
            <p className="normal-text mt-2 sm">
              PLACEHOLDER TEXT ABOUT YOUR PROJECT
            </p>
          </div>
          <div className={styles.socialContainer}>
            <p className="normal-text op-1 bold sm nm">Follow Us</p>
            <div className={styles.socials}>
              {socials.map((social) => (
                <a
                  href={social.link}
                  rel="noopener noreferrer"
                  target="_blank"
                  key={social.link}>
                    {<social.icon color="#1E2833" />}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};
