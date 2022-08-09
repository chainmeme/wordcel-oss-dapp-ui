import {
  useEffect,
  useContext,
  createContext,
  useState,
} from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUser } from '@/lib/networkRequests';
import { User } from '@prisma/client';

interface UserData {
  user: User | null;
  cardinal_verified: boolean;
}

interface SidebarData {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface CardinalData {
  cardinal_verified: boolean;
  username: string;
}

const UserContext = createContext<UserData | null>(null);
const SidebarContext = createContext<SidebarData | null>(null);
const CardinalContext = createContext<CardinalData | null>(null);

const UserProvider = ({ children }: any) => {
  const wallet = useWallet();
  const [user, setUser] = useState<null | User>(null);

  useEffect(() => {
    (async function () {
      if (wallet.publicKey) {
        const _user = await getUser(wallet.publicKey.toBase58());
        if (_user) {
          setUser({ user: _user } as any);
        } else {
          setUser(null)
        }
      }
    })();
    if (!wallet.publicKey) setUser(null);
  }, [wallet.publicKey]);

  return (
    <UserContext.Provider value={user as any}>
      {children}
    </UserContext.Provider>
  );
}

const SidebarProvider = ({ children }: any) => {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  return (
    <SidebarContext.Provider value={{
      collapsed,
      setCollapsed
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

const CardinalProvider = ({ children }: any) => {
  const wallet = useWallet();
  const [cardinal_verified, setCardinalVerified] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    (async function () {
      if (wallet.publicKey) {
        const response = await fetch(`/api/cardinal/${wallet.publicKey.toBase58()}`);
        const data = await response.json();
        if (data.success) {
          setCardinalVerified(true);
          setUsername(data.identity.username);
        }
      }
    })();
  }, [wallet.publicKey]);

  return (
    <CardinalContext.Provider value={{
      cardinal_verified,
      username,
    }}>
      {children}
    </CardinalContext.Provider>
  );
}

const useUser = () => useContext(UserContext);
const useSidebar = () => useContext(SidebarContext);
const useCardinal = () => useContext(CardinalContext);

export {
  useUser,
  UserProvider,
  useSidebar,
  SidebarProvider,
  useCardinal,
  CardinalProvider,
};