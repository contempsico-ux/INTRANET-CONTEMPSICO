import React, { useState, createContext, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { User } from './types';
import Header from './components/Header';
import Mural from './features/Mural';
import Calendario from './features/Calendario';
import Tarefas from './features/Tarefas';
import Recursos from './features/Recursos';
import Login from './features/Login';
import { XMarkIcon } from './components/Icons';
import { supabase, login as apiLogin, logout as apiLogout, getUserProfile } from './services/api';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- Toast Notification System ---
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextType {
  addToast: (message: string, type: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(currentToasts => [...currentToasts, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center justify-between w-full max-w-xs p-4 text-white rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-4 -mr-1 p-1 rounded-md hover:bg-white/20">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activePage, setActivePage] = useState<string>('Mural');
  const { addToast } = useToast();

  useEffect(() => {
    setAuthLoading(true);

    // Safety timeout: if auth check takes more than 3 seconds, show login screen
    const safetyTimeout = setTimeout(() => {
      console.warn("Auth check timeout - showing login screen");
      setAuthLoading(false);
      setCurrentUser(null);
    }, 3000);

    const { data, error } = supabase.auth.onAuthStateChange(async (_event, session) => {
      clearTimeout(safetyTimeout); // Clear timeout if callback is called
      try {
        if (session?.user) {
          // If a session exists, fetch the full user profile from our database
          const userProfile = await getUserProfile(session.user.id);
          setCurrentUser(userProfile);
        } else {
          // If there's no session, user is logged out
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error processing auth state. Forcing logout.", error);
        // If fetching profile fails, it might be an inconsistent state.
        // Attempt to sign out to clear the session.
        await apiLogout().catch(e => console.error("Forced logout failed", e));
        setCurrentUser(null);
      } finally {
        // This is crucial. It ensures the loading screen is hidden
        // even if there was an error during the process.
        setAuthLoading(false);
      }
    });
    
    if (error) {
      console.error("Failed to subscribe to auth state changes:", error);
      clearTimeout(safetyTimeout);
      setAuthLoading(false);
      return;
    }

    const subscription = data?.subscription;

    return () => {
      clearTimeout(safetyTimeout);
      // Cleanup the subscription when the component unmounts
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const user = await apiLogin(email, password);
      // The onAuthStateChange listener will automatically set the current user.
      // We don't need to call setCurrentUser here.
      setActivePage('Mural');
      addToast(`Bem-vindo(a), ${user.name}!`, 'success');
    } catch (error) {
      if (error instanceof Error) {
        addToast(error.message, 'error');
      } else {
        addToast('An unknown error occurred.', 'error');
      }
      throw error;
    }
  }, [addToast]);

  const logout = useCallback(async () => {
    await apiLogout();
    // The onAuthStateChange listener will set currentUser to null.
    setActivePage('Mural'); // Reset to a default page.
  }, []);
  
  const authContextValue = useMemo(() => ({
    currentUser,
    login,
    logout,
  }), [currentUser, login, logout]);


  if (authLoading) {
    return <div className="min-h-screen flex justify-center items-center bg-app-bg text-primary">Carregando sessão...</div>;
  }

  return (
    <AuthContext.Provider value={authContextValue}>
        {!currentUser ? (
          <Login />
        ) : (
          <div className="min-h-screen flex flex-col">
            <Header activePage={activePage} setActivePage={setActivePage} />
            <main className="flex-1 p-4 md:p-8">
              <div hidden={activePage !== 'Mural'}>
                <Mural setActivePage={setActivePage} />
              </div>
              <div hidden={activePage !== 'Calendário'}>
                <Calendario />
              </div>
              <div hidden={activePage !== 'Tarefas'}>
                <Tarefas />
              </div>
              <div hidden={activePage !== 'Recursos'}>
                <Recursos />
              </div>
            </main>
          </div>
        )}
    </AuthContext.Provider>
  );
};

const AppWrapper: React.FC = () => (
    <ToastProvider>
        <App />
    </ToastProvider>
);

export default AppWrapper;