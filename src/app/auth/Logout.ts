import { signOut } from 'firebase/auth'
import { auth } from '@/app/services/firebase/config'

export const logout = async () => {
  try {
    await signOut(auth)
    console.log('User logged out')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
