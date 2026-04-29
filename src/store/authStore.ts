import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient } from '@/lib/queryClient'

interface User {
  name: string
  email: string
  full_name: string
  user_image?: string
  roles?: Array<{ role: string }>
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const USER_FIELDS = ['name', 'email', 'full_name', 'user_image', 'roles'] as const

async function fetchUserProfile(identifier: string): Promise<User | null> {
  try {
    const detailsRes = await fetch(
      `/api/erpnext/resource/User/${encodeURIComponent(identifier)}?fields=${encodeURIComponent(JSON.stringify(USER_FIELDS))}`,
      { credentials: 'include' }
    )

    const details = await detailsRes.json().catch(() => ({}))
    const record = details?.data
    if (!record) {
      return null
    }

    return {
      name: record.name || identifier,
      email: record.email || identifier,
      full_name: record.full_name || identifier,
      user_image: record.user_image,
      roles: record.roles || [],
    }
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch(
            '/api/erpnext/method/login',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                usr: email,
                pwd: password,
              }),
              credentials: 'include',
            }
          )

          let data: { message?: string; full_name?: string } = {}
          try {
            data = await response.json()
          } catch {
            // non-JSON response (e.g. HTML error page from proxy)
          }

          if (response.status === 500 || response.status === 502 || response.status === 503) {
            throw new Error('Cannot connect to server. ' + (data?.message ?? ''))
          }

          if (response.status === 401 || response.status === 403) {
            const erpMsg: string = data?.message ?? ''
            // Surface the real ERPNext error (e.g. "User disabled or missing", "Incorrect password")
            throw new Error(erpMsg || 'Invalid email or password')
          }

          if (data.message === 'Logged In') {
            const fallbackUser: User = {
              name: data.full_name || email,
              email: email,
              full_name: data.full_name || email,
            }

            set({
              user: fallbackUser,
              isAuthenticated: true,
              isLoading: false,
            })

            void (async () => {
              try {
                const meRes = await fetch('/api/erpnext/method/frappe.auth.get_logged_user', {
                  credentials: 'include',
                })
                const meData = await meRes.json().catch(() => ({}))
                const loggedUser = meData?.message || email
                const profile = await fetchUserProfile(loggedUser)

                if (!profile || !get().isAuthenticated) {
                  return
                }

                set({ user: profile })
              } catch {
                // Keep the basic authenticated state if profile enrichment fails.
              }
            })()
          } else {
            set({ isLoading: false })
            const erpMsg: string = data?.message ?? ''
            throw new Error(erpMsg || 'Login failed. Please try again.')
          }
        } catch (error) {
          set({ isLoading: false, isAuthenticated: false })
          if (error instanceof Error) {
            throw error
          }
          throw new Error('Cannot connect to server')
        }
      },

      logout: async () => {
        try {
          await fetch('/api/erpnext/method/logout', {
            method: 'POST',
            credentials: 'include',
          })
        } catch {
          // Clear client state even if the server logout request fails.
        }

        set({ user: null, isAuthenticated: false, isLoading: false })
        queryClient.clear()

        if (typeof window !== 'undefined') {
          localStorage.removeItem('stockflow-auth')
        }
      },

      checkAuth: async () => {
        const shouldBlock = !get().isAuthenticated

        if (shouldBlock) {
          set({ isLoading: true })
        }

        try {
          const meRes = await fetch('/api/erpnext/method/frappe.auth.get_logged_user', {
            credentials: 'include',
          })

          const meData = await meRes.json().catch(() => ({}))
          const loggedUser = meData?.message

          if (!meRes.ok || !loggedUser || loggedUser === 'Guest') {
            set({ user: null, isAuthenticated: false, isLoading: false })
            return
          }

          const currentUser: User = {
            name: loggedUser,
            email: loggedUser,
            full_name: loggedUser,
          }

          const profile = await fetchUserProfile(loggedUser)

          set({ user: profile ?? currentUser, isAuthenticated: true, isLoading: false })
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },
    }),
    {
      name: 'stockflow-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)