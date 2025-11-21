import { lazy, Suspense } from 'react';
import Loading from './common/Loading';

// Lazy load page components
const Home = lazy(() => import('./pages/Home'));
const ConnectWallet = lazy(() => import('./pages/ConnectWallet'));

// Higher-order component to wrap lazy components with Suspense
export const withSuspense = (Component: React.ComponentType<any>) => {
  return function SuspenseWrapper(props: any) {
    return (
      <Suspense fallback={<Loading />}>
        <Component {...props} />
      </Suspense>
    );
  };
};

// Export lazy components wrapped with Suspense
export const LazyHome = withSuspense(Home);
export const LazyConnectWallet = withSuspense(ConnectWallet);
// Default exports for backward compatibility
export {
  Home,
  ConnectWallet
};