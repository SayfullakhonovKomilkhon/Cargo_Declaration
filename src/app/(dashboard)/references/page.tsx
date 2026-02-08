import {
  BookOpen,
  Globe,
  Banknote,
  Truck,
  Package,
  Building2,
  Scale,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const referenceCategories = [
  {
    title: 'Страны',
    description: 'Справочник стран мира',
    icon: Globe,
    href: '/references/countries',
    count: 25,
  },
  {
    title: 'Валюты',
    description: 'Справочник валют и курсов',
    icon: Banknote,
    href: '/references/currencies',
    count: 12,
  },
  {
    title: 'Виды транспорта',
    description: 'Справочник видов транспорта',
    icon: Truck,
    href: '/references/transport-modes',
    count: 8,
  },
  {
    title: 'Коды ТН ВЭД',
    description: 'Товарная номенклатура',
    icon: Package,
    href: '/references/hs-codes',
    count: 10,
  },
  {
    title: 'Таможенные посты',
    description: 'Справочник таможенных органов',
    icon: Building2,
    href: '/references/customs-offices',
    count: 14,
  },
  {
    title: 'Единицы измерения',
    description: 'Справочник единиц измерения',
    icon: Scale,
    href: '/references/units',
    count: 12,
  },
  {
    title: 'Условия поставки',
    description: 'Incoterms и условия поставки',
    icon: FileCheck,
    href: '/references/delivery-terms',
    count: 11,
  },
  {
    title: 'Таможенные процедуры',
    description: 'Виды таможенных процедур',
    icon: BookOpen,
    href: '/references/procedures',
    count: 11,
  },
];

export default function ReferencesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Справочники
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Справочные данные для заполнения деклараций
        </p>
      </div>

      {/* Reference categories grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {referenceCategories.map((category) => (
          // @ts-expect-error - typed routes with dynamic href
          <Link key={category.href} href={category.href}>
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <category.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{category.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{category.description}</CardDescription>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {category.count} записей
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
