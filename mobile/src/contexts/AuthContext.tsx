import { createContext, ReactNode, useState, useEffect } from 'react'
import { api } from '../services/api'
import * as Google from 'expo-auth-session/providers/google'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
WebBrowser.maybeCompleteAuthSession()
interface UserProps {
    name: string
    avatarUrl: string
}
export interface AuthContextDataProps {
    user: UserProps
    isUserLoading: boolean
    signIn: () => Promise<void>
}
interface AuthProviderProps {
    children: ReactNode
}
export const AuthContext = createContext({} as AuthContextDataProps)
export function AuthContextProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<UserProps>({} as UserProps)
    const [isUserLoading, setIsUserLoading] = useState(false)
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: process.env.CLIENT_ID,
        redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
        scopes: ['profile', 'email']
    })
    // console.log(AuthSession.makeRedirectUri({ useProxy: true }))
    async function signIn() {
        try {
            setIsUserLoading(true)
            await promptAsync()
        } catch (error) {
            console.log(error)
            throw error
        } finally {
            setIsUserLoading(false)
        }
    }
    async function signInWithGoogle(access_token: string) {
        // console.log("TOKEN DE AUTENTICAÇÃO ===> ", access_token)
        try {
            setIsUserLoading(true)
            const tokenResponse = await api.post('/users',  { access_token })
            console.log(tokenResponse.data)
            api.defaults.headers.common['Authorization'] = `Bearer ${tokenResponse.data.token}`
            const userInfoResponse = await api.get('/me')
            console.log(userInfoResponse.data)
            setUser(userInfoResponse.data.user)
        } catch (error) {
            console.log(error)
            throw error
        } finally {
            setIsUserLoading(false)
        }
    }
    useEffect(() => {
        if (response?.type === 'success' && response.authentication?.accessToken) {
            signInWithGoogle(response.authentication.accessToken)
        }
    }, [response])
    return (
        <AuthContext.Provider value={{
            signIn,
            isUserLoading,
            user,
            // user: {
            //     name: 'Ruan Wagner',
            //     avatarUrl: 'https://github.com/ruanwagner.png'
            // }
        }}>
            {children}
        </AuthContext.Provider>
    )
}