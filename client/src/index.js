import React, { StrictMode } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { createRoot } from 'react-dom/client';
import { AppProviders } from '@Contexts';
import { RouteProvider } from './router';
import useSWR from 'swr';
import App from './App';
import API from '@API';
import './index.css';

const fetcher = () => API.getConstants().then((r) => r.data);

function Root() {
  const { data, error } = useSWR('serverConstants', fetcher);

  if (data)
    return (
      <StrictMode>
        <RouteProvider>
          <AppProviders serverConstants={data}>
            <App serverConstantsError={error} />
          </AppProviders>
        </RouteProvider>
      </StrictMode>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<Root />);
