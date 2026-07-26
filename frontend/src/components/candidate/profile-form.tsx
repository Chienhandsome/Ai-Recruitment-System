"use client"

import * as React from "react"
import { Upload, Save, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProfileFormProps {
  fullName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  address: string | null
  githubUrl: string | null
  linkedinUrl: string | null
}

export function ProfileForm({
  fullName,
  email,
  phone,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _avatarUrl,
  address,
  githubUrl,
  linkedinUrl,
}: ProfileFormProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveMessage(null)

    // TODO: Implement API call to update profile
    // Simulate a brief delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    setIsSaving(false)
    setSaveMessage("Đã lưu thông tin thành công!")
    setTimeout(() => setSaveMessage(null), 3000)
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
              defaultValue=""
              placeholder="Frontend Developer, Full-stack Engineer..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="professionalSummary">Giới thiệu bản thân</Label>
            <Textarea
              id="professionalSummary"
              name="professionalSummary"
              defaultValue=""
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
              defaultValue=""
              placeholder="https://myportfolio.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* CV Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CV / Resume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-input p-6 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">
              Tải lên CV của bạn
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOC, DOCX (tối đa 5MB)
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled
            >
              <Upload className="h-4 w-4" />
              Chọn tệp
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-md bg-secondary p-3">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-secondary-foreground">
              <span className="font-medium">Tự động cập nhật hồ sơ:</span>{" "}
              Khi bạn upload CV, hệ thống AI sẽ tự động phân tích và cập nhật
              thông tin hồ sơ của bạn bao gồm kỹ năng, kinh nghiệm, học vấn và
              dự án.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "Đang lưu..." : "Lưu thông tin"}
        </Button>
        {saveMessage && (
          <p className="text-sm text-green-600 font-medium">{saveMessage}</p>
        )}
      </div>
    </form>
  )
}
