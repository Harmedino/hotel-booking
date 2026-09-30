import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { MotionConfig } from 'motion/react';
import './index.css';
import App from './App.jsx';
import store from './store/store';
import { ToastProvider } from './components/ui/Toast';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <MotionConfig reducedMotion="user">
          <ToastProvider>
            <App />
          </ToastProvider>
        </MotionConfig>
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
