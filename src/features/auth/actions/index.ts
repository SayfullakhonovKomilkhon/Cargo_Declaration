'use server';

import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { z } from 'zod';

import { signIn, signOut } from '@/server/auth';
import { prisma } from '@/server/db/client';

import type { AuthResult } from '../types';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

/**
 * Login schema
 */
const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
});

/**
 * Registration schema with strong password requirements
 */
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
    createOrganization: z.boolean().optional(),
    organizationName: z.string().optional(),
    organizationInn: z
      .string()
      .regex(/^\d{9}$/, 'ИНН должен содержать 9 цифр')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.createOrganization) {
        return data.organizationName && data.organizationName.length >= 2;
      }
      return true;
    },
    {
      message: 'Введите название организации',
      path: ['organizationName'],
    }
  );

// ==========================================
// SERVER ACTIONS
// ==========================================

/**
 * Login action
 */
export async function login(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  try {
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    // Validate input
    const parsed = loginSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Неверные данные',
      };
    }

    // Attempt sign in
    await signIn('credentials', {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });

    return {
      success: true,
      message: 'Вход выполнен успешно',
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            error: 'Неверный email или пароль',
          };
        default:
          return {
            success: false,
            error: 'Произошла ошибка при входе',
          };
      }
    }
    throw error;
  }
}

/**
 * Register action
 */
export async function register(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  try {
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      name: formData.get('name'),
      createOrganization: formData.get('createOrganization') === 'true',
      organizationName: formData.get('organizationName') || '',
      organizationInn: formData.get('organizationInn') || '',
    };

    // Validate input
    const parsed = registerSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Неверные данные',
      };
    }

    const { email, password, name, createOrganization, organizationName, organizationInn } =
      parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Пользователь с таким email уже существует',
      };
    }

    // Check if organization INN already exists
    if (createOrganization && organizationInn) {
      const existingOrg = await prisma.organization.findUnique({
        where: { inn: organizationInn },
      });

      if (existingOrg) {
        return {
          success: false,
          error: 'Организация с таким ИНН уже зарегистрирована',
        };
      }
    }

    // Hash password with bcrypt (12 rounds for production security)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create organization if requested
    let organizationId: string | null = null;

    if (createOrganization && organizationName) {
      const organization = await prisma.organization.create({
        data: {
          name: organizationName,
          inn: organizationInn || `temp_${Date.now()}`, // Temporary INN if not provided
        },
      });
      organizationId = organization.id;
    }

    // Create user
    await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: 'DECLARANT', // Default role
        organizationId,
      },
    });

    // Log the registration
    console.log(`New user registered: ${email}`);

    return {
      success: true,
      message: 'Регистрация прошла успешно. Теперь вы можете войти.',
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Произошла ошибка при регистрации',
    };
  }
}

/**
 * Logout action
 */
export async function logout(): Promise<void> {
  await signOut({ redirect: true, redirectTo: '/login' });
}

/**
 * Direct login (for programmatic use)
 */
export async function loginDirect(email: string, password: string): Promise<AuthResult> {
  try {
    await signIn('credentials', {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    return {
      success: true,
      message: 'Вход выполнен успешно',
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: 'Неверный email или пароль',
      };
    }
    throw error;
  }
}
