import { Route, Routes } from 'react-router-dom';
import { HelloPanel } from './components/HelloPanel';
import { HealthPage } from './pages/HealthPage';

function HomeShell() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-sand rounded-2xl shadow-sm p-10 text-center">
        <HelloPanel />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeShell />} />
      <Route path="/health" element={<HealthPage />} />
    </Routes>
  );
}
