import { createContext, useContext, useState, ReactNode } from 'react';

type Route = '/' | '/agendar' | '/agenda';

interface RouterContextType {
  currentRoute: Route;
  navigate: (route: Route) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentRoute, setCurrentRoute] = useState<Route>('/');

  const navigate = (route: Route) => {
    setCurrentRoute(route);
    window.history.pushState({}, '', route);
  };

  return (
    <RouterContext.Provider value={{ currentRoute, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter deve ser usado dentro de um RouterProvider');
  }
  return context;
}
