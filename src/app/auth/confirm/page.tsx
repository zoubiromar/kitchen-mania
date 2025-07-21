'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Get the error details from the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const error = hashParams.get('error')
    const errorCode = hashParams.get('error_code')
    const errorDescription = hashParams.get('error_description')

    if (error || errorCode) {
      // Handle various error cases
      if (errorCode === 'otp_expired') {
        setStatus('error')
        setMessage('This confirmation link has expired. Please sign up again to receive a new confirmation email.')
      } else if (error === 'access_denied') {
        setStatus('error')
        setMessage(errorDescription || 'Access was denied. Please try again.')
      } else {
        setStatus('error')
        setMessage('An error occurred while confirming your email. Please try again.')
      }
    } else {
      // If no error, assume success
      setStatus('success')
      setMessage('Your email has been confirmed successfully! You can now sign in.')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Confirming Email...'}
            {status === 'success' && '✅ Email Confirmed!'}
            {status === 'error' && '❌ Confirmation Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we confirm your email address.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status !== 'loading' && (
            <>
              <p className="mb-4 text-sm text-gray-600">
                {message}
              </p>
              <div className="space-y-2">
                {status === 'success' && (
                  <Button 
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                )}
                {status === 'error' && (
                  <>
                    <Button 
                      onClick={() => router.push('/login')}
                      className="w-full"
                    >
                      Back to Login
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      If you continue to have issues, please try signing up again with a different email address.
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 