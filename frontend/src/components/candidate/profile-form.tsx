"use client"

import * as React from "react"
import { Save, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { updateCandidateProfile } from "@/lib/candidate-api"
import { ResumeUpload } from "@/components/candidate/resume-upload"

interface ProfileFormProps {
  fullName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  address: string | null
  desiredTitle: string | null
  professionalSummary: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  onCancel: () => void
  onSaved: () => void
}

export function ProfileForm({
  fullName,
  email,
  phone,
  address,
  desiredTitle,
  professionalSummary,
  githubUrl,
  linkedinUrl,
  portfolioUrl,
  onCancel,
  onSaved,
}: ProfileFormProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveMessage(null)

    const formData = new FormData(e.currentTarget)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setSaveMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        setIsSaving(false)
        return
      }

      await updateCandidateProfile(session.access_token, {
        fullName: formData.get("fullName") as string,
        phone: (formData.get("phone") as string) || null,
        address: (formData.get("address") as string) || null,
        desiredTitle: (formData.get("desiredTitle") as string) || null,
        professionalSummary: (formData.get("professionalSummary") as string) || null,
        linkedinUrl: (formData.get("linkedinUrl") as string) || null,
        githubUrl: (formData.get("githubUrl") as string) || null,
        portfolioUrl: (formData.get("portfolioUrl") as string) || null,
      })

      setSaveMessage("Đã lưu thông tin thành công!")
      setTimeout(() => {
        onSaved()
      }, 1000)
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu thông tin."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={fullName}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email không thể thay đổi
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={phone ?? ""}
                placeholder="0901234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                name="address"
                defaultValue={address ?? ""}
                placeholder="TP. Hồ Chí Minh"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin nghề nghiệp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="desiredTitle">Vị trí mong muốn</Label>
            <Input
              id="desiredTitle"
              name="desiredTitle"
              defaultValue={desiredTitle ?? ""}
              placeholder="Frontend Developer, Full-stack Engineer..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="professionalSummary">Giới thiệu bản thân</Label>
            <Textarea
              id="professionalSummary"
              name="professionalSummary"
              defaultValue={professionalSummary ?? ""}
              placeholder="Tóm tắt kinh nghiệm, kỹ năng nổi bật và mục tiêu nghề nghiệp của bạn..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liên kết</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn</Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              defaultValue={linkedinUrl ?? ""}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub</Label>
            <Input
              id="githubUrl"
              name="githubUrl"
              type="url"
              defaultValue={githubUrl ?? ""}
              placeholder="https://github.com/username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolioUrl">Portfolio / Website</Label>
            <Input
              id="portfolioUrl"
              name="portfolioUrl"
              type="url"
              defaultValue={portfolioUrl ?? ""}
              placeholder="https://myportfolio.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* CV Upload */}
      <ResumeUpload />

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "Đang lưu..." : "Lưu thông tin"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4" />
          Hủy
        </Button>
        {saveMessage && (
          <p
            className={`text-sm font-medium ${
              saveMessage.includes("thành công")
                ? "text-green-600"
                : "text-destructive"
            }`}
          >
            {saveMessage}
          </p>
        )}
      </div>
    </form>
  )
}
