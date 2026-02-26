import { BrowserRouter } from 'react-router-dom';
import { DevPanel } from './components/DevPanel';
import { AppRoutes } from './routes';
import { useCoolingTicker } from './hooks/useCoolingTicker';

function AppContent() {
  useCoolingTicker();
  return (
    <>
      <AppRoutes />
      <DevPanel />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
