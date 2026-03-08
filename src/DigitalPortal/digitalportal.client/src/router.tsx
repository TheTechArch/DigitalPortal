import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import SluttbrukerApiPage from './pages/SluttbrukerApiPage';
import TjenesteeigerApiPage from './pages/TjenesteeigerApiPage';
import PdpPage from './pages/PdpPage';
import NotFoundPage from './pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'auth/callback', element: <AuthCallbackPage /> },
      { path: 'sluttbruker-api', element: <SluttbrukerApiPage /> },
      { path: 'tjenesteeier-api', element: <TjenesteeigerApiPage /> },
      { path: 'pdp', element: <PdpPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;
