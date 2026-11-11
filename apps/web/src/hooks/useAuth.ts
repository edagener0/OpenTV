import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { libraryApi, libraryKeys, type User } from '@/lib/library'

export const sessionKey = ['session'] as const

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: libraryApi.me,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useUser(): User | null {
  return useSession().data ?? null
}

export function useAuthActions() {
  const queryClient = useQueryClient()

  const onSignedIn = (user: User) => {
    queryClient.setQueryData(sessionKey, user)
    void queryClient.invalidateQueries({ queryKey: libraryKeys.all })
  }

  const login = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      libraryApi.login(username, password),
    onSuccess: ({ user }) => onSignedIn(user),
  })

  const register = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      libraryApi.register(username, password),
    onSuccess: ({ user }) => onSignedIn(user),
  })

  const logout = useMutation({
    mutationFn: (everywhere: boolean = false) =>
      everywhere ? libraryApi.logoutAll() : libraryApi.logout(),
    onSettled: () => {
      queryClient.setQueryData(sessionKey, null)
      queryClient.removeQueries({ queryKey: libraryKeys.all })
    },
  })

  return { login, register, logout }
}
