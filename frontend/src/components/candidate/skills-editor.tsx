"use client"

import * as React from "react"
import { Plus, Search, ShieldCheck, Sparkles, Star, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  type CandidateSkillData,
  type CandidateSkillInput,
  type SkillItemData,
  searchSkills,
  updateCandidateSkills,
} from "@/lib/candidate-api"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────

type ProficiencyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"

interface LocalSkill {
  skillId: string
  skillName: string
  proficiencyLevel: ProficiencyLevel
  isPrimary: boolean
  source: "EXTRACTED" | "SELF_DECLARED" | "VERIFIED"
}

interface SkillsEditorProps {
  initialSkills: CandidateSkillData[]
  isEditing: boolean
}

const toLocalSkills = (candidateSkills: CandidateSkillData[]): LocalSkill[] =>
  candidateSkills.map((skill) => ({
    skillId: skill.skillId,
    skillName: skill.skill.name,
    proficiencyLevel: skill.proficiencyLevel,
    isPrimary: skill.isPrimary,
    source: skill.source,
  }))

// ─── Constants ────────────────────────────────────────────────────────

const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  BEGINNER: "Mới bắt đầu",
  INTERMEDIATE: "Trung bình",
  ADVANCED: "Thành thạo",
  EXPERT: "Chuyên gia",
}

const PROFICIENCY_OPTIONS: ProficiencyLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]

// ─── Component ────────────────────────────────────────────────────────

export function SkillsEditor({ initialSkills, isEditing }: SkillsEditorProps) {
  const [skills, setSkills] = React.useState<LocalSkill[]>(() => toLocalSkills(initialSkills))

  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<SkillItemData[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null)

  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!value.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchSkills(value.trim())
        const existingIds = new Set(skills.map((s) => s.skillId))
        setSearchResults(results.filter((r) => !existingIds.has(r.id)))
        setShowDropdown(true)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  const addSkill = (skill: SkillItemData) => {
    setSkills((prev) => [
      ...prev,
      {
        skillId: skill.id,
        skillName: skill.name,
        proficiencyLevel: "BEGINNER",
        isPrimary: false,
        source: "SELF_DECLARED",
      },
    ])
    setSearchQuery("")
    setSearchResults([])
    setShowDropdown(false)
  }

  const removeSkill = (skillId: string) => {
    setSkills((prev) => prev.filter((s) => s.skillId !== skillId))
  }

  const updateSkillProficiency = (skillId: string, level: ProficiencyLevel) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.skillId === skillId && s.source !== "VERIFIED"
          ? {
              ...s,
              proficiencyLevel: level,
              source: s.source === "EXTRACTED" ? "SELF_DECLARED" : s.source,
            }
          : s,
      ),
    )
  }

  const togglePrimary = (skillId: string) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.skillId === skillId && s.source !== "VERIFIED"
          ? {
              ...s,
              isPrimary: !s.isPrimary,
              source: s.source === "EXTRACTED" ? "SELF_DECLARED" : s.source,
            }
          : s,
      ),
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setSaveMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        return
      }

      const skillInputs: CandidateSkillInput[] = skills.map((skill) => ({
        skillId: skill.skillId,
        proficiencyLevel: skill.proficiencyLevel,
        isPrimary: skill.isPrimary,
      }))

      const savedSkills = await updateCandidateSkills(session.access_token, skillInputs)
      setSkills(toLocalSkills(savedSkills))
      setSaveMessage("Đã lưu kỹ năng thành công!")
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu kỹ năng.")
    } finally {
      setIsSaving(false)
    }
  }

  // ─── View mode (not editing) ───────────────────────────────────────
  if (!isEditing) {
    return null // ProfileView handles the skill display in view mode
  }

  // ─── Edit mode ─────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kỹ năng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative" ref={dropdownRef}>
          <Label htmlFor="skill-search" className="sr-only">
            Tìm kiếm kỹ năng
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="skill-search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true)
              }}
              placeholder="Tìm kiếm kỹ năng (React, Python, Figma...)"
              className="pl-9"
            />
          </div>

          {/* Dropdown Results */}
          {showDropdown && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-background shadow-lg max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  Đang tìm kiếm...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => addSkill(skill)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                  >
                    <Plus className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">{skill.name}</span>
                    {skill.category && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {skill.category.name}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  Không tìm thấy kỹ năng phù hợp
                </div>
              )}
            </div>
          )}
        </div>

        {skills.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Kỹ năng do AI đề xuất có thể chỉnh sửa. Sau khi bạn thay đổi, thông tin của bạn sẽ
              được ưu tiên hơn kết quả từ CV.
            </p>
            <div className="space-y-2">
              {skills.map((skill) => {
                const isVerified = skill.source === "VERIFIED"

                return (
                  <div
                    key={skill.skillId}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-input p-3 transition-colors focus-within:border-primary/50"
                  >
                    <button
                      type="button"
                      onClick={() => togglePrimary(skill.skillId)}
                      disabled={isVerified}
                      className={`shrink-0 rounded-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                        skill.isPrimary
                          ? "text-amber-500"
                          : "text-muted-foreground hover:text-amber-400"
                      }`}
                      title={
                        skill.isPrimary ? "Bỏ đánh dấu kỹ năng chính" : "Đánh dấu là kỹ năng chính"
                      }
                      aria-label={
                        skill.isPrimary ? "Bỏ đánh dấu kỹ năng chính" : "Đánh dấu là kỹ năng chính"
                      }
                    >
                      <Star className="h-4 w-4" fill={skill.isPrimary ? "currentColor" : "none"} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">{skill.skillName}</span>
                        {skill.source === "EXTRACTED" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            <Sparkles className="h-3 w-3" aria-hidden="true" />
                            AI đề xuất
                          </span>
                        )}
                        {skill.source === "VERIFIED" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                            Đã xác thực
                          </span>
                        )}
                      </div>
                    </div>

                    <select
                      value={skill.proficiencyLevel}
                      disabled={isVerified}
                      onChange={(e) =>
                        updateSkillProficiency(skill.skillId, e.target.value as ProficiencyLevel)
                      }
                      className="order-last h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60 sm:order-none sm:ml-auto sm:w-auto"
                      aria-label={`Mức độ thành thạo cho ${skill.skillName}`}
                    >
                      {PROFICIENCY_OPTIONS.map((level) => (
                        <option key={level} value={level}>
                          {PROFICIENCY_LABELS[level]}
                        </option>
                      ))}
                    </select>

                    {!isVerified && (
                      <button
                        type="button"
                        onClick={() => removeSkill(skill.skillId)}
                        className="shrink-0 rounded-sm text-muted-foreground transition-all hover:text-destructive active:scale-95"
                        aria-label={`Xóa kỹ năng ${skill.skillName}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có kỹ năng nào. Hãy tìm kiếm và thêm kỹ năng của bạn.
          </p>
        )}

        {/* Save button */}
        <div className="flex items-center gap-4 pt-2">
          <Button type="button" onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? "Đang lưu..." : "Lưu kỹ năng"}
          </Button>
          {saveMessage && (
            <p
              className={`text-sm font-medium ${
                saveMessage.includes("thành công") ? "text-green-600" : "text-destructive"
              }`}
            >
              {saveMessage}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
