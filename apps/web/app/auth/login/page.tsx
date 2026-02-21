'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftCircle } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { loginSchema, LoginFormData } from '@/lib/validators/auth';
import AuthInput from '@/components/forms/AuthInput';
import AuthButton from '@/components/forms/AuthButton';
import FormError from '@/components/forms/FormError';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>('');
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setError('Something went wrong');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8 relative">
      <Link href="/browse" className="absolute top-8 left-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
        <ArrowLeftCircle className="h-8 w-8" />
      </Link>
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              href="/auth/register"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              create a new account
            </Link>
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-white p-8 shadow dark:bg-gray-800">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <AuthInput
                id="email"
                label="Email address"
                type="email"
                placeholder="john@example.com"
                error={errors.email?.message}
                register={register('email')}
              />

              <AuthInput
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                register={register('password')}
              />

              <FormError message={error} />

              <AuthButton type="submit" isLoading={isSubmitting}>
                Sign in
              </AuthButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
