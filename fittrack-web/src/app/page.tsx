import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-4xl font-bold">FitTrack</h1>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
        >
          Войти
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 border border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50 transition"
        >
          Регистрация
        </Link>
      </div>
    </main>
  );
}
