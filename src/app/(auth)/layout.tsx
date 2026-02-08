import { FileText } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 lg:flex">
        <div className="flex items-center gap-2 text-white">
          <FileText className="h-8 w-8" />
          <span className="text-2xl font-bold">ГТД УЗ</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Автоматизация
            <br />
            таможенных деклараций
          </h1>
          <p className="max-w-md text-lg text-slate-400">
            Используйте искусственный интеллект для быстрого и точного заполнения грузовых
            таможенных деклараций Узбекистана.
          </p>
          <div className="flex gap-8 text-sm text-slate-500">
            <div>
              <div className="text-2xl font-bold text-white">AI</div>
              <div>Распознавание документов</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">50+</div>
              <div>Полей автозаполнения</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">24/7</div>
              <div>Доступ к системе</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-600">© 2026 ГТД УЗ. Все права защищены.</div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
