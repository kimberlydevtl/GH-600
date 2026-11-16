import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthGate, AuthProvider } from './auth';
import './index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </AuthGate>
    </AuthProvider>
  </StrictMode>
);
