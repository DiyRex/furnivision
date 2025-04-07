'use client'

import React, { useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useRouter } from 'next/navigation'
import { auth } from '@/app/services/firebase/config'
import { onIdTokenChanged } from 'firebase/auth'
import { logout } from '../auth/Logout'

const ProfilePage = () => {
  const [user, loading, error] = useAuthState(auth)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        console.log('Token expired or user signed out')
        router.push('/auth') // redirect to login
      } else {
        const token = await user.getIdToken()
        console.log('Token refreshed:', token)
      }
    })
  
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      // 🔐 Redirect if not authenticated
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return <p>Loading...</p>
  }

  if (error) {
    return <p>Error: {error.message}</p>
  }

  if (!user) {
    return null
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>👤 Profile Page</h1>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>User ID:</strong> {user.uid}</p>
      <button className='btn bg-red-900 py-2 px-4 rounded'
        onClick={async () => {
            await logout()
            router.push('/auth')
        }}
        >
        Logout
        </button>
    </div>
  )
}

export default ProfilePage
