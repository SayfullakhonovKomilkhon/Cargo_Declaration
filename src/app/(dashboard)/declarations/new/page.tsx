import { Metadata } from 'next';

import { DeclarationWizard, BlankDeclarationForm } from '@/features/declarations';
import { Breadcrumbs } from '@/features/layout/components';

export const metadata: Metadata = {
  title: 'Создание декларации | GTD UZ',
  description: 'Создание новой таможенной декларации',
};

interface NewDeclarationPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function NewDeclarationPage({ searchParams }: NewDeclarationPageProps) {
  const params = await searchParams;
  const mode = params.mode || 'ai';

  // Для пустой формы показываем только бланк без header
  if (mode === 'blank') {
    return <BlankDeclarationForm />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumbs */}
      <div className="flex-shrink-0">
        <Breadcrumbs />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 space-y-1 mt-4 mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Создание новой декларации
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Загрузите документы — AI автоматически заполнит декларацию
        </p>
      </div>

      {/* Wizard - Upload → AI → Form */}
      <div className="flex-1 min-h-0">
        <DeclarationWizard />
      </div>
    </div>
  );
}
