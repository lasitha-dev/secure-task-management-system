import { useEffect } from 'react';
import { buildAppUrl } from '@taskmaster/shared-ui/appLinks';

export default function App() {
  useEffect(() => {
    globalThis.location.replace(buildAppUrl('task', '/notifications'));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111621] px-6 text-slate-100">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="material-symbols-outlined animate-spin text-5xl text-[#144bb8]">progress_activity</span>
        <h1 className="text-2xl font-bold">Opening notifications</h1>
        <p className="max-w-md text-sm text-slate-400">Redirecting to the workspace notifications view.</p>
      </div>
    </main>
  );
}