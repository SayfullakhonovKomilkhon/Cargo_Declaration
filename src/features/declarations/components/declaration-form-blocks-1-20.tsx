'use client';

import { Loader2, Save, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CountrySelect, CurrencySelect, IncotermsSelect, ModalSelect } from '@/shared/ui';

import { useDeclarationForm } from '../hooks/use-declaration-form';
import { ContainerInput } from './container-input';

interface DeclarationFormBlocks1To20Props {
  declarationId?: string;
  onSuccess?: (id: string) => void;
}

export function DeclarationFormBlocks1To20({
  declarationId,
  onSuccess,
}: DeclarationFormBlocks1To20Props) {
  const { form, isLoading, isSaving, lastSaved, handleSaveDraft, handleSubmit } =
    useDeclarationForm({
      declarationId,
      onSuccess,
      enableAutoSave: true,
    });

  const watchDeclarationType = form.watch('declarationType');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Загрузка данных...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-8">
        {/* Индикатор автосохранения */}
        {lastSaved && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Сохранено: {format(lastSaved, 'HH:mm:ss', { locale: ru })}
            </span>
          </div>
        )}

        {/* ==========================================
            ГРУППА: ОСНОВНАЯ ИНФОРМАЦИЯ
        ========================================== */}
        <Card>
          <CardHeader>
            <CardTitle>Блок 1: Тип декларации</CardTitle>
            <CardDescription>
              Выберите тип таможенной декларации
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="declarationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип декларации *</FormLabel>
                  <FormControl>
                    <ModalSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: 'IMPORT', label: 'ИМ — Импорт' },
                        { value: 'EXPORT', label: 'ЭК — Экспорт' },
                        { value: 'TRANSIT', label: 'ТР — Транзит' },
                      ]}
                      placeholder="Выберите тип"
                      dialogTitle="Выберите тип декларации"
                    />
                  </FormControl>
                  <FormDescription>
                    Определяет направление перемещения товаров
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ==========================================
            ГРУППА: СТОРОНЫ СДЕЛКИ
        ========================================== */}

        {/* Блок 2: Экспортер */}
        <Card>
          <CardHeader>
            <CardTitle>Блок 2: Экспортер / Грузоотправитель</CardTitle>
            <CardDescription>
              Информация о лице, отправляющем товар
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="exporterName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Наименование *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ООО «Компания»"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exporterCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Страна *</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value}
                        onChange={field.onChange}
                        error={!!form.formState.errors.exporterCountry}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exporterAddress"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Адрес *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Полный адрес экспортера"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Блок 8: Грузополучатель */}
        <Card>
          <CardHeader>
            <CardTitle>Блок 8: Грузополучатель</CardTitle>
            <CardDescription>
              Информация о лице, получающем товар
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="consigneeName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Наименование *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ООО «Компания»"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consigneeTin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ИНН *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456789"
                        maxLength={9}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>9 цифр</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consigneeCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Страна *</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value}
                        onChange={field.onChange}
                        error={!!form.formState.errors.consigneeCountry}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consigneeAddress"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Адрес *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Полный адрес грузополучателя"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Блок 14: Декларант */}
        <Card>
          <CardHeader>
            <CardTitle>Блок 14: Декларант / Представитель</CardTitle>
            <CardDescription>
              Лицо, подающее декларацию
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="declarantStatus"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Статус *</FormLabel>
                    <FormControl>
                      <ModalSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: 'DECLARANT', label: 'Декларант' },
                          { value: 'REPRESENTATIVE', label: 'Представитель' },
                        ]}
                        placeholder="Выберите статус"
                        dialogTitle="Выберите статус"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="declarantName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Наименование *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ООО «Компания» или ФИО"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="declarantTin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ИНН *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456789"
                        maxLength={9}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>9 цифр</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="declarantAddress"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Адрес *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Полный адрес декларанта"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Блок 9: Ответственное лицо */}
        <Card>
          <CardHeader>
            <CardTitle>Блок 9: Ответственное лицо</CardTitle>
            <CardDescription>
              Лицо, ответственное за финансовое урегулирование
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="responsiblePerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ФИО</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Иванов Иван Иванович"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsiblePosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Должность</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Директор"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ==========================================
            ГРУППА: ГЕОГРАФИЯ
        ========================================== */}

        <Card>
          <CardHeader>
            <CardTitle>География</CardTitle>
            <CardDescription>
              Блоки 10, 11, 15, 16, 17: Страны, связанные с перемещением товара
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Блок 10: Страна назначения */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="destinationCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Блок 10: Страна назначения *</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value}
                        onChange={field.onChange}
                        error={!!form.formState.errors.destinationCountry}
                      />
                    </FormControl>
                    <FormDescription>Конечная страна доставки</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Блок 11: Торговая страна */}
              <FormField
                control={form.control}
                name="tradingCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Блок 11: Торговая страна</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value || ''}
                        onChange={field.onChange}
                        error={!!form.formState.errors.tradingCountry}
                      />
                    </FormControl>
                    <FormDescription>Страна контрагента</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Блок 15: Страна отправления */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dispatchCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Блок 15: Страна отправления *</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value}
                        onChange={field.onChange}
                        error={!!form.formState.errors.dispatchCountry}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dispatchRegion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Регион отправления</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Область, регион"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Блок 16: Страна происхождения */}
            <FormField
              control={form.control}
              name="originCountry"
              render={({ field }) => (
                <FormItem className="max-w-md">
                  <FormLabel>Блок 16: Страна происхождения *</FormLabel>
                  <FormControl>
                    <CountrySelect
                      value={field.value}
                      onChange={field.onChange}
                      error={!!form.formState.errors.originCountry}
                    />
                  </FormControl>
                  <FormDescription>
                    Страна, где товар был произведен
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Блок 17: Транзит (показываем только если тип = TRANSIT) */}
            {watchDeclarationType === 'TRANSIT' && (
              <FormField
                control={form.control}
                name="transitDestinationCountry"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <FormLabel>Блок 17: Страна назначения (транзит) *</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value || ''}
                        onChange={field.onChange}
                        error={!!form.formState.errors.transitDestinationCountry}
                      />
                    </FormControl>
                    <FormDescription>
                      Обязательно для транзитных деклараций
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* ==========================================
            ГРУППА: ТРАНСПОРТ
        ========================================== */}

        <Card>
          <CardHeader>
            <CardTitle>Транспорт</CardTitle>
            <CardDescription>
              Блоки 18, 19: Информация о транспортных средствах
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Блок 18: Идентификация транспорта */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="transportNationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Блок 18: Национальность ТС</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Страна регистрации"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Номер ТС</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Госномер или название судна"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Блок 19: Контейнеры */}
            <div className="space-y-2">
              <h4 className="font-medium">Блок 19: Контейнеры</h4>
              <FormField
                control={form.control}
                name="containerNumbers"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ContainerInput
                        value={field.value || []}
                        onChange={field.onChange}
                        error={form.formState.errors.containerNumbers?.message}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ==========================================
            ГРУППА: ФИНАНСЫ
        ========================================== */}

        <Card>
          <CardHeader>
            <CardTitle>Финансовая информация</CardTitle>
            <CardDescription>
              Блоки 12, 20: Стоимость и условия поставки
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Блок 12: Таможенная стоимость */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="totalCustomsValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Блок 12: Таможенная стоимость *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Валюта *</FormLabel>
                    <FormControl>
                      <CurrencySelect
                        value={field.value}
                        onChange={field.onChange}
                        error={!!form.formState.errors.currency}
                        showRate
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Блок 20: Условия поставки */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="incoterms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Блок 20: Условия поставки (Incoterms) *</FormLabel>
                    <FormControl>
                      <IncotermsSelect
                        value={field.value}
                        onChange={field.onChange}
                        error={!!form.formState.errors.incoterms}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Место доставки</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Город, порт, терминал"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ==========================================
            ГРУППА: ДОПОЛНИТЕЛЬНО
        ========================================== */}

        <Card>
          <CardHeader>
            <CardTitle>Дополнительная информация</CardTitle>
            <CardDescription>
              Блоки 4-7, 13: Справочные номера и доп. сведения
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Блоки 4, 7 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Блок 4: Справочный номер</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Номер контракта, инвойса"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="internalReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Блок 7: Внутренний номер</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Внутренний номер"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Блоки 5, 6 */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="totalPackages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Блок 5: Кол-во мест</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="packageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип упаковки</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Коробки, паллеты"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Блок 6: Кол-во товара</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantityUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Единица измерения</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="кг, шт, м³"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Блок 13: Доп. информация */}
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Блок 13: Дополнительная информация</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Любая дополнительная информация о декларации"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Максимум 2000 символов</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ==========================================
            КНОПКИ ДЕЙСТВИЙ
        ========================================== */}

        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Сохранить черновик
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            Продолжить
          </Button>
        </div>
      </form>
    </Form>
  );
}
