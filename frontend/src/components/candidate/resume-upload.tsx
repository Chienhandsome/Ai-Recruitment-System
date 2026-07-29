"use client"

import * as React from "react"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  uploadResume,
  getResumeStatus,
  type ResumeStatusResponse,
} from "@/lib/candidate-api"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────

type UploadState =
  | { step: "idle" }
  | { step: "uploading"; fileName: string }
  | { step: "processing"; resumeId: string; fileName: string }
  | { step: "done"; fileName: string }
  | { step: "error"; message: string; fileName?: string }

// ─── Component ────────────────────────────────────────────────────────

export function ResumeUpload() {
  const [state, setState] = React.useState<UploadState>({ step: "idle" })
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const getToken = async (): Promise<string | null> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const handleFile = async (file: File) => {
    // Validate client-side
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      setState({ step: "error", message: "Chỉ chấp nhận file PDF hoặc DOCX." })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setState({ step: "error", message: "File vượt quá kích thước tối đa 5MB." })
      return
    }

    const token = await getToken()
    if (!token) {
      setState({ step: "error", message: "Phiên đăng nhập đã hết hạn." })
      return
    }

    // Upload
    setState({ step: "uploading", fileName: file.name })

    try {
      const result = await uploadResume(token, file)
      setState({ step: "processing", resumeId: result.id, fileName: file.name })
      startPolling(token, result.id, file.name)
    } catch (error) {
      setState({
        step: "error",
        message: error instanceof Error ? error.message : "Upload thất bại.",
        fileName: file.name,
      })
    }
  }

  const startPolling = (token: string, resumeId: string, fileName: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    pollingRef.current = setInterval(async () => {
      try {
        const status: ResumeStatusResponse = await getResumeStatus(token, resumeId)

        if (status.parsingStatus === "PARSED") {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setState({ step: "done", fileName })
          // Auto-reload after short delay to show fresh extracted data
          setTimeout(() => window.location.reload(), 1500)
        } else if (status.parsingStatus === "FAILED") {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setState({
            step: "error",
            message: status.parsingErrorMessage || "Phân tích CV thất bại.",
            fileName,
          })
        }
        // PENDING / PROCESSING → keep polling
      } catch {
        // Ignore transient fetch errors, keep polling
      }
    }, 3000)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be re-selected
    e.target.value = ""
  }

  const reset = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setState({ step: "idle" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">CV / Resume</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Upload area */}
        {(state.step === "idle" || state.step === "error") && (
          <>
            <div
              role="button"
              tabIndex={0}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click() }}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-input hover:border-primary/50"
              }`}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">
                Kéo thả hoặc nhấn để tải lên CV
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOCX (tối đa 5MB)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleInputChange}
              aria-label="Chọn file CV"
            />
          </>
        )}

        {/* Uploading state */}
        {state.step === "uploading" && (
          <div className="flex items-center gap-3 rounded-lg border border-input p-4">
            <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{state.fileName}</p>
              <p className="text-xs text-muted-foreground">Đang tải lên...</p>
            </div>
          </div>
        )}

        {/* Processing state */}
        {state.step === "processing" && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0 dark:text-blue-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-700 truncate dark:text-blue-300">
                {state.fileName}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                AI đang phân tích CV của bạn...
              </p>
            </div>
          </div>
        )}

        {/* Done state */}
        {state.step === "done" && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 dark:text-green-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-green-700 truncate dark:text-green-300">
                {state.fileName}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Phân tích hoàn tất! Đang cập nhật hồ sơ...
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {state.step === "error" && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <div className="min-w-0 flex-1">
                {state.fileName && (
                  <p className="text-sm font-medium truncate">{state.fileName}</p>
                )}
                <p className="text-xs text-destructive">{state.message}</p>
              </div>
              <Button variant="outline" size="sm" onClick={reset}>
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* AI hint */}
        {state.step === "idle" && (
          <div className="flex items-start gap-2 rounded-md bg-secondary p-3">
            <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-secondary-foreground">
              <span className="font-medium">Tự động cập nhật hồ sơ:</span>{" "}
              Khi bạn upload CV, hệ thống AI sẽ tự động phân tích và cập nhật
              kỹ năng, kinh nghiệm, học vấn và dự án của bạn.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
