'use client';

import { useState } from 'react';
import {
  HelpCircle,
  FileText,
  Upload,
  Bot,
  Calculator,
  Download,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/shared/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: 'Общие вопросы',
    question: 'Что такое ГТД?',
    answer:
      'ГТД (Грузовая Таможенная Декларация) - это официальный документ, который подается в таможенные органы при перемещении товаров через границу. В ГТД указывается информация о товарах, их стоимости, отправителе, получателе и рассчитываются таможенные платежи.',
  },
  {
    category: 'Общие вопросы',
    question: 'Для кого предназначена эта система?',
    answer:
      'Система предназначена для таможенных брокеров, импортеров, экспортеров и логистических компаний Узбекистана, которым необходимо оформлять таможенные декларации.',
  },
  {
    category: 'Создание декларации',
    question: 'Как создать новую декларацию?',
    answer:
      'Перейдите в раздел "Декларации" и нажмите кнопку "Создать декларацию". Выберите тип декларации (импорт, экспорт, транзит) и заполните необходимые поля. Вы можете сохранить черновик в любой момент и продолжить позже.',
  },
  {
    category: 'Создание декларации',
    question: 'Какие поля обязательны для заполнения?',
    answer:
      'Обязательные поля отмечены звёздочкой (*). К ним относятся: тип декларации, данные экспортера и получателя, описание товаров, коды ТН ВЭД, вес и стоимость товаров. При сохранении черновика проверка обязательных полей не выполняется.',
  },
  {
    category: 'Документы',
    question: 'Какие типы документов можно загружать?',
    answer:
      'Поддерживаются: коммерческий инвойс, упаковочный лист, коносамент, авиа накладная, CMR, сертификат происхождения, контракт, сертификат качества, лицензия и другие документы. Форматы файлов: PDF, JPG, PNG (до 10 МБ).',
  },
  {
    category: 'Документы',
    question: 'Как работает AI обработка документов?',
    answer:
      'После загрузки документа нажмите "Обработать" или "Обработать все". AI проанализирует документ и извлечёт данные: наименование отправителя/получателя, адреса, товары, цены и т.д. Вы можете просмотреть и применить извлечённые данные к форме декларации.',
  },
  {
    category: 'AI функции',
    question: 'Как работает AI подсказка для кода ТН ВЭД?',
    answer:
      'При заполнении кода товара нажмите на иконку с волшебной палочкой рядом с полем. Введите описание товара, и AI предложит подходящие коды ТН ВЭД с объяснением выбора. Выберите наиболее подходящий код.',
  },
  {
    category: 'AI функции',
    question: 'Насколько точны результаты AI?',
    answer:
      'AI показывает уровень уверенности для каждого поля (в процентах). Зелёный цвет (90%+) - высокая уверенность, жёлтый (70-90%) - средняя, требуется проверка, красный (<70%) - низкая, обязательна проверка. Всегда проверяйте данные перед подачей декларации.',
  },
  {
    category: 'Расчёт платежей',
    question: 'Как рассчитываются таможенные платежи?',
    answer:
      'Система автоматически рассчитывает: таможенную пошлину (по ставке для кода ТН ВЭД), НДС (обычно 12%), акциз (для отдельных товаров) и таможенный сбор. Расчёт производится от таможенной стоимости в UZS по текущему курсу ЦБ.',
  },
  {
    category: 'Расчёт платежей',
    question: 'Откуда берутся курсы валют?',
    answer:
      'Курсы валют загружаются автоматически с сайта Центрального банка Узбекистана. При создании декларации используется курс на текущую дату. Вы можете указать курс вручную при необходимости.',
  },
  {
    category: 'Экспорт',
    question: 'Как скачать декларацию в PDF?',
    answer:
      'Откройте декларацию и нажмите кнопку "Экспорт" → "Скачать PDF". Также доступен предпросмотр и печать. PDF формируется в соответствии с официальным форматом ГТД.',
  },
  {
    category: 'Экспорт',
    question: 'Для чего нужен экспорт в XML?',
    answer:
      'XML формат используется для электронной подачи декларации в таможенные системы. Выберите "Экспорт" → "Скачать XML" для получения файла в стандартном формате.',
  },
  {
    category: 'Настройки',
    question: 'Как настроить AI обработку?',
    answer:
      'Перейдите в Настройки → AI. Здесь вы можете: включить/выключить автоматическую обработку документов, установить минимальный порог уверенности для автозаполнения, выбрать какие поля могут заполняться автоматически.',
  },
  {
    category: 'Безопасность',
    question: 'Безопасно ли хранить документы в системе?',
    answer:
      'Да. Все документы хранятся в зашифрованном виде. Доступ к данным имеют только авторизованные пользователи. Система соответствует требованиям безопасности для работы с коммерческой информацией.',
  },
];

const GUIDES = [
  {
    icon: FileText,
    title: 'Создание декларации',
    description: 'Пошаговое руководство по созданию ГТД',
    steps: [
      'Перейдите в раздел "Декларации"',
      'Нажмите "Создать декларацию"',
      'Выберите тип: Импорт, Экспорт или Транзит',
      'Заполните данные экспортера и получателя',
      'Добавьте товарные позиции',
      'Загрузите подтверждающие документы',
      'Проверьте расчёт платежей',
      'Сохраните и подайте декларацию',
    ],
  },
  {
    icon: Upload,
    title: 'Загрузка документов',
    description: 'Как загружать и обрабатывать документы',
    steps: [
      'Откройте декларацию или раздел "Документы"',
      'Перетащите файлы или нажмите "Загрузить"',
      'Выберите тип документа (инвойс, контракт и т.д.)',
      'Дождитесь загрузки файла',
      'Нажмите "Обработать" для AI анализа',
      'Просмотрите извлечённые данные',
      'Примените данные к форме',
    ],
  },
  {
    icon: Bot,
    title: 'AI обработка',
    description: 'Использование искусственного интеллекта',
    steps: [
      'Загрузите документ (PDF или изображение)',
      'AI поддерживает русский, английский, узбекский языки',
      'Нажмите "Обработать документ"',
      'Дождитесь анализа (10-30 секунд)',
      'Просмотрите извлечённые данные и уверенность',
      'Отметьте нужные поля для применения',
      'Проверьте данные перед сохранением',
    ],
  },
  {
    icon: Calculator,
    title: 'Расчёт платежей',
    description: 'Автоматический расчёт таможенных платежей',
    steps: [
      'Укажите код ТН ВЭД для каждого товара',
      'Введите таможенную стоимость',
      'Система найдёт ставки пошлины и НДС',
      'Получите текущий курс валюты',
      'Расчёт выполнится автоматически',
      'Проверьте итоговую сумму платежей',
    ],
  },
  {
    icon: Download,
    title: 'Экспорт и печать',
    description: 'Получение готовых документов',
    steps: [
      'Откройте созданную декларацию',
      'Нажмите кнопку "Экспорт"',
      'Выберите формат: PDF, XML или предпросмотр',
      'PDF - для печати и архива',
      'XML - для электронной подачи',
      'Предпросмотр - для проверки перед экспортом',
    ],
  },
  {
    icon: Settings,
    title: 'Настройка системы',
    description: 'Персонализация под ваши нужды',
    steps: [
      'Перейдите в раздел "Настройки"',
      'Профиль - измените данные аккаунта',
      'AI настройки - автообработка и уверенность',
      'Уведомления - email оповещения',
      'Безопасность - смена пароля',
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQs, setOpenFAQs] = useState<Set<number>>(new Set());

  const filteredFAQs = FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (index: number) => {
    const newOpen = new Set(openFAQs);
    if (newOpen.has(index)) {
      newOpen.delete(index);
    } else {
      newOpen.add(index);
    }
    setOpenFAQs(newOpen);
  };

  // Group FAQs by category
  const faqsByCategory = filteredFAQs.reduce(
    (acc, item, index) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push({ ...item, index });
      return acc;
    },
    {} as Record<string, (FAQItem & { index: number })[]>
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Помощь</h1>
          <p className="text-gray-500">
            Руководства и ответы на частые вопросы
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Поиск по вопросам и руководствам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Guides */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Руководства</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <Card key={guide.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <guide.icon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">{guide.title}</CardTitle>
                </div>
                <CardDescription>{guide.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1 text-sm text-gray-600">
                  {guide.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="font-medium text-blue-600 shrink-0">
                        {idx + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Частые вопросы (FAQ)</h2>
        
        {Object.keys(faqsByCategory).length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            По вашему запросу ничего не найдено
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(faqsByCategory).map(([category, items]) => (
              <div key={category}>
                <Badge variant="secondary" className="mb-3">
                  {category}
                </Badge>
                <div className="space-y-2">
                  {items.map((item) => (
                    <Collapsible
                      key={item.index}
                      open={openFAQs.has(item.index)}
                      onOpenChange={() => toggleFAQ(item.index)}
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          className={cn(
                            'w-full flex items-center justify-between p-4 rounded-lg border text-left transition-colors',
                            'hover:bg-gray-50',
                            openFAQs.has(item.index)
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-white border-gray-200'
                          )}
                        >
                          <span className="font-medium pr-4">{item.question}</span>
                          {openFAQs.has(item.index) ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 pt-2 text-gray-600 text-sm leading-relaxed">
                          {item.answer}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contact */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Нужна дополнительная помощь?</CardTitle>
            <CardDescription>
              Свяжитесь с нами, если не нашли ответ на свой вопрос
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <a
              href="mailto:support@gtd.uz"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              support@gtd.uz
            </a>
            <a
              href="tel:+998712000000"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              +998 71 200 00 00
            </a>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
