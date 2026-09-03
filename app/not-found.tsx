import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-200">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
        <p className="text-slate-400 mb-6">Could not find requested resource</p>
        <Link href="/" className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );
}
