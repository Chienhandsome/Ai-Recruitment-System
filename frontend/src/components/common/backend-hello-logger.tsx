"use client"

import { useEffect } from "react"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://ai-recruitment-system-test-deploy.onrender.com/api"

export function BackendHelloLogger() {
  useEffect(() => {
    const controller = new AbortController()

    async function logBackendHello() {
      try {
        const response = await fetch(API_URL, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Backend returned HTTP ${response.status}`)
        }

        const message = await response.text()
        console.log(message)
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          // Log clean warning if local backend is offline
          console.warn("Backend API endpoint is offline or unavailable:", API_URL)
        }
      }
    }

    void logBackendHello()

    return () => controller.abort()
  }, [])

  return null
}
