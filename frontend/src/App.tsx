import { HelloPanel } from './components/HelloPanel';

export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-sand rounded-2xl shadow-sm p-10 text-center">
        <HelloPanel />
      </div>
    </main>
  );
}
