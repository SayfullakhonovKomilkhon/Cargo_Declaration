'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { register } from '../actions';
import { PasswordStrength } from './password-strength';

import type { AuthResult } from '../types';


const registerSchema = z
  .object({
    email: z.string().email('Введите корректный email'),
    password: z
      .string()
      .min(12, 'Пароль должен содержать минимум 12 символов')
      .regex(/[a-z]/, 'Пароль должен содержать строчную букву')
      .regex(/[A-Z]/, 'Пароль должен содержать заглавную букву')
      .regex(/[0-9]/, 'Пароль должен содержать цифру')
      .regex(/[^a-zA-Z0-9]/, 'Пароль должен содержать специальный символ'),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    createOrganization: z.boolean(),
    organizationName: z.string().optional(),
    organizationInn: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<AuthResult | null, FormData>(
    register,
    null
  );
  const [showOrgFields, setShowOrgFields] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      createOrganization: false,
      organizationName: '',
      organizationInn: '',
    },
  });

  const password = form.watch('password');

  // Handle successful registration
  useEffect(() => {
    if (state?.success) {
      router.push('/login?registered=true');
    }
  }, [state?.success, router]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        {/* Server error message */}
        {state?.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{state.error}</div>
        )}

        {/* Success message */}
        {state?.success && state?.message && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">{state.message}</div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Иван Иванов" disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    disabled={isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <PasswordStrength password={password} className="mt-2" />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Подтвердите пароль</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    disabled={isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Organization checkbox */}
        <FormField
          control={form.control}
          name="createOrganization"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.checked);
                    setShowOrgFields(e.target.checked);
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={isPending}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal">Создать организацию</FormLabel>
              {/* Hidden input for form data */}
              <input type="hidden" name="createOrganization" value={field.value ? 'true' : 'false'} />
            </FormItem>
          )}
        />

        {/* Organization fields */}
        {showOrgFields && (
          <Card className="border-dashed">
            <CardContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название организации</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ООО 'Компания'" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationInn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ИНН организации</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123456789"
                        maxLength={9}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>9 цифр</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Регистрация...
            </>
          ) : (
            'Зарегистрироваться'
          )}
        </Button>

        <div className="text-center text-sm text-gray-600">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Войти
          </Link>
        </div>
      </form>
    </Form>
  );
}
