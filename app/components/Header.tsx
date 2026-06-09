'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { resolvePortalSessionRedirect } from '@/lib/client-portal-sign-in'
import { useSupabaseSession } from '@/lib/hooks/useSupabaseSession'
import { UserNameDisplay } from './UserNameDisplay';

export default function Header() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user, signOut } = useSupabaseSession()
  const genericRedirectUrl = encodeURIComponent('/auth/continue')

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    const redirectSignedInUser = async () => {
      const destination = await resolvePortalSessionRedirect()
      if (!destination || destination === '/') return
      if (window.location.pathname === '/' || window.location.pathname.startsWith('/sign-in')) {
        router.replace(destination)
      }
    }

    void redirectSignedInUser()
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <header className="flex justify-end items-center p-4 gap-4 h-16">
        {/* Loading skeleton */}
      </header>
    )
  }

  return (
    <header className="flex justify-end items-center p-4 gap-4 h-16">
      {!isSignedIn ? (
        <>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.sessionStorage.removeItem('jobserve_pending_role');
                window.localStorage.removeItem('jobserve_pending_role');
                window.sessionStorage.removeItem('jobserve_pending_email');
                window.localStorage.removeItem('jobserve_pending_email');
              }
              router.push('/');
            }}
            className="rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.sessionStorage.removeItem('jobserve_pending_role');
                window.localStorage.removeItem('jobserve_pending_role');
                window.sessionStorage.removeItem('jobserve_pending_email');
                window.localStorage.removeItem('jobserve_pending_email');
              }
              router.push(`/sign-up?redirect_url=${genericRedirectUrl}`);
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Sign Up
          </button>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <UserNameDisplay />
          <button
            type="button"
            onClick={async () => {
              if (typeof window !== 'undefined') {
                window.sessionStorage.removeItem('jobserve_pending_role');
                window.localStorage.removeItem('jobserve_pending_role');
              }
              await signOut()
              router.push('/')
            }}
            className="rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  )
}

