import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
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
      { path: 'sluttbruker-api', element: <SluttbrukerApiPage /> },
      { path: 'tjenesteeier-api', element: <TjenesteeigerApiPage /> },
      { path: 'pdp', element: <PdpPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;
