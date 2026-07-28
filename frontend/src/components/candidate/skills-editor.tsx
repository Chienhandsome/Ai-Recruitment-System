"use client"

import * as React from "react"
import { X, Search, Plus, Star } from "lucide-react"
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
  yearsExperience: number | null
  isPrimary: boolean
  source: "EXTRACTED" | "SELF_DECLARED" | "VERIFIED"
}

interface SkillsEditorProps {
  initialSkills: CandidateSkillData[]
  isEditing: boolean
}

// ─── Constants ────────────────────────────────────────────────────────

const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  BEGINNER: "Mới bắt đầu",
  INTERMEDIATE: "Trung bình",
  ADVANCED: "Thành thạo",
  EXPERT: "Chuyên gia",
}

const PROFICIENCY_OPTIONS: ProficiencyLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
]

// ─── Component ────────────────────────────────────────────────────────

export function SkillsEditor({ initialSkills, isEditing }: SkillsEditorProps) {
  const [skills, setSkills] = React.useState<LocalSkill[]>(() =>
    initialSkills.map((s) => ({
      skillId: s.skillId,
      skillName: s.skill.name,
      proficiencyLevel: s.proficiencyLevel,
      yearsExperience: s.yearsExperience,
      isPrimary: s.isPrimary,
      source: s.source,
    }))
  )

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
        yearsExperience: null,
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
        s.skillId === skillId ? { ...s, proficiencyLevel: level } : s
      )
    )
  }

  const updateSkillYears = (skillId: string, years: number | null) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.skillId === skillId ? { ...s, yearsExperience: years } : s
      )
    )
  }

  const togglePrimary = (skillId: string) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.skillId === skillId ? { ...s, isPrimary: !s.isPrimary } : s
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setSaveMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        return
      }

      const selfDeclaredSkills: CandidateSkillInput[] = skills
        .filter((s) => s.source === "SELF_DECLARED")
        .map((s) => {
          const item: CandidateSkillInput = {
            skillId: s.skillId,
            proficiencyLevel: s.proficiencyLevel,
            isPrimary: s.isPrimary,
          }
          if (s.yearsExperience != null && s.yearsExperience >= 0) {
            item.yearsExperience = Number(s.yearsExperience)
          }
          return item
        })

      await updateCandidateSkills(session.access_token, selfDeclaredSkills)
      setSaveMessage("Đã lưu kỹ năng thành công!")
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu kỹ năng."
      )
    } finally {
      setIsSaving(false)
    }
  }

  const selfDeclaredSkills = skills.filter((s) => s.source === "SELF_DECLARED")
  const extractedSkills = skills.filter((s) => s.source !== "SELF_DECLARED")

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

        {/* Extracted Skills (from CV - read only) */}
        {extractedSkills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Từ CV (tự động nhận diện)
            </p>
            <div className="flex flex-wrap gap-2">
              {extractedSkills.map((skill) => (
                <div
                  key={skill.skillId}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm dark:border-blue-800 dark:bg-blue-950"
                >
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    {skill.skillName}
                  </span>
                  <span className="text-xs text-blue-500 dark:text-blue-400">
                    {PROFICIENCY_LABELS[skill.proficiencyLevel]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Self-Declared Skills (editable) */}
        {selfDeclaredSkills.length > 0 && (
          <div className="space-y-2">
            {extractedSkills.length > 0 && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tự khai báo
              </p>
            )}
            <div className="space-y-2">
              {selfDeclaredSkills.map((skill) => (
                <div
                  key={skill.skillId}
                  className="flex items-center gap-2 rounded-lg border border-input p-3"
                >
                  {/* Primary toggle */}
                  <button
                    type="button"
                    onClick={() => togglePrimary(skill.skillId)}
                    className={`shrink-0 ${
                      skill.isPrimary
                        ? "text-amber-500"
                        : "text-muted-foreground hover:text-amber-400"
                    }`}
                    title={
                      skill.isPrimary
                        ? "Bỏ đánh dấu kỹ năng chính"
                        : "Đánh dấu là kỹ năng chính"
                    }
                    aria-label={
                      skill.isPrimary
                        ? "Bỏ đánh dấu kỹ năng chính"
                        : "Đánh dấu là kỹ năng chính"
                    }
                  >
                    <Star
                      className="h-4 w-4"
                      fill={skill.isPrimary ? "currentColor" : "none"}
                    />
                  </button>

                  <span className="font-medium text-sm min-w-0 truncate">
                    {skill.skillName}
                  </span>

                  {/* Proficiency selector */}
                  <select
                    value={skill.proficiencyLevel}
                    onChange={(e) =>
                      updateSkillProficiency(
                        skill.skillId,
                        e.target.value as ProficiencyLevel
                      )
                    }
                    className="ml-auto h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/20"
                    aria-label={`Mức độ thành thạo cho ${skill.skillName}`}
                  >
                    {PROFICIENCY_OPTIONS.map((level) => (
                      <option key={level} value={level}>
                        {PROFICIENCY_LABELS[level]}
                      </option>
                    ))}
                  </select>

                  {/* Years experience — numeric only */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={50}
                      step={0.5}
                      value={skill.yearsExperience ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === "") {
                          updateSkillYears(skill.skillId, null)
                          return
                        }
                        const val = parseFloat(raw)
                        if (!isNaN(val) && val >= 0 && val <= 50) {
                          updateSkillYears(skill.skillId, val)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-"].includes(e.key)) {
                          e.preventDefault()
                        }
                      }}
                      placeholder="0"
                      className="h-8 w-16 rounded-md border border-input bg-background px-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-ring/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label={`Số năm kinh nghiệm cho ${skill.skillName}`}
                    />
                    <span className="text-xs text-muted-foreground">năm</span>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.skillId)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Xóa kỹ năng ${skill.skillName}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
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
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
          >
            {isSaving ? "Đang lưu..." : "Lưu kỹ năng"}
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
      </CardContent>
    </Card>
  )
}
