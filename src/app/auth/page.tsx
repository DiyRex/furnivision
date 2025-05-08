// admin@example.com
// admin123
'use client'

import React from 'react'
import { AppProvider } from '@toolpad/core/AppProvider'
import { SignInPage, type AuthProvider } from '@toolpad/core/SignInPage'
import { useTheme } from '@mui/material/styles'
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth'
import { auth } from '@/app/services/firebase/config'
import { useRouter } from 'next/navigation'
import ClientOnly from '../../../components/ClientOnly'

const AuthPage = () => {
  const theme = useTheme()

  const [signInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth)
  const router = useRouter()

  const signIn = async (
    provider: AuthProvider,
    formData?: FormData,
    _callbackUrl?: string
  ) => {
    const email = formData?.get('email')?.toString() || ''
    const password = formData?.get('password')?.toString() || ''

    console.log('Email:', email)
    console.log('Password:', password)

    try {
      const result = await signInWithEmailAndPassword(email, password)
      console.log(result)
      if (!result?.user) {
        return {
          error: 'Invalid credentials',
        }
      }

      router.push('/dashboard')
      return {
        redirectUrl: '/dashboard',
      }

    } catch (err: any) {
      console.error('Firebase login error:', err)
      return {
        error: err?.message || 'Authentication failed',
      }
    }
  }

  const BRANDING = {
    logo: (
      <h1 className="text-3xl font-bold text-indigo-600">FurniVision</h1>
    ),
    title: '',
  }

  const providers = [{ id: 'credentials', name: 'Credentials' }]

  return (
  <ClientOnly>
    <AppProvider branding={BRANDING} theme={theme}>
    <SignInPage
  signIn={signIn}
  providers={providers}
  slotProps={{
    emailField: {
      autoFocus: true,
      label: 'Email',
      sx: { mb: 2, }, // margin bottom
    },
    passwordField: {
      label: 'Password',
      sx: { mb: 4, mt: 4 },
    },
    submitButton: {
      sx: {
        mt: 4,
        fontSize: '0.875rem', // small text
        py: 1,                // vertical padding
        px: 2,                // horizontal padding
        textTransform: 'none', // avoid uppercase if any
      },
    },
    form: {
      noValidate: true,
    },
  }}
/>

    </AppProvider>
  </ClientOnly>
  )
}

export default AuthPage
