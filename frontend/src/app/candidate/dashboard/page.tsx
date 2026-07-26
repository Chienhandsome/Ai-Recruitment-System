import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit } from "lucide-react"

export const dynamic = "force-dynamic"

export default function CandidateDashboardPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <section className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Chào mừng bạn đến với SmartRecruit AI
        </h1>
        <p className="mt-2 text-muted-foreground">
          Khám phá cơ hội nghề nghiệp phù hợp với bạn
        </p>
      </section>

      {/* Quick Actions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Hồ sơ của bạn</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cập nhật hồ sơ cá nhân và CV để tăng cơ hội được nhà tuyển dụng
            tìm thấy.
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Việc làm phù hợp</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            AI sẽ phân tích hồ sơ và gợi ý các vị trí phù hợp nhất với kỹ năng
            của bạn.
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Đơn ứng tuyển</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Theo dõi trạng thái các đơn ứng tuyển và lịch phỏng vấn của bạn.
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
