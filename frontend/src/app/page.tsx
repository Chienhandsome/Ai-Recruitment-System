import Link from "next/link"
import { Search, MapPin, Briefcase, Code, Megaphone, Users, Calculator, Palette, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionHeading } from "@/components/common/section-heading"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { getCandidateJobCategories } from "@/lib/candidate-api"

export default async function HomePage() {
  let categories: { id: string; name: string; slug: string }[] = [];
  try {
    categories = await getCandidateJobCategories();
  } catch {
    categories = [];
  }

  const getDepartmentIcon = (name: string) => {
    switch (name) {
      case "Công nghệ thông tin": return <Code className="h-6 w-6 text-primary" />
      case "Kinh doanh": return <Briefcase className="h-6 w-6 text-primary" />
      case "Marketing": return <Megaphone className="h-6 w-6 text-primary" />
      case "Nhân sự": return <Users className="h-6 w-6 text-primary" />
      case "Kế toán": return <Calculator className="h-6 w-6 text-primary" />
      case "Thiết kế": return <Palette className="h-6 w-6 text-primary" />
      default: return <Briefcase className="h-6 w-6 text-primary" />
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-surface-container py-20 lg:py-32 overflow-hidden border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Tìm kiếm công việc mơ ước cùng <span className="text-primary">AI</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Khám phá hàng ngàn cơ hội việc làm từ các công ty hàng đầu. Công nghệ AI của chúng tôi sẽ giúp bạn tìm được vị trí phù hợp nhất với kỹ năng và kinh nghiệm.
              </p>

              {/* Job Search Form */}
              <form
                action="/candidate"
                method="GET"
                className="bg-surface p-3 sm:p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-3 sm:gap-4 max-w-4xl mx-auto"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    name="search"
                    placeholder="Chức danh, kỹ năng, tên công ty..." 
                    className="pl-11 h-12 text-base border-0 focus-visible:ring-0 bg-muted/50 rounded-xl" 
                  />
                </div>
                <div className="hidden md:block w-px bg-border my-2"></div>
                <div className="relative flex-1">
                  <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    name="location"
                    placeholder="Tất cả địa điểm (Hà Nội, TP.HCM...)" 
                    className="pl-11 h-12 text-base border-0 focus-visible:ring-0 bg-muted/50 rounded-xl" 
                  />
                </div>
                <Button type="submit" className="h-12 px-8 text-base font-bold shrink-0 w-full md:w-auto rounded-xl">
                  Tìm việc
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Featured Departments / Categories */}
        <section id="categories" className="py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading 
              title="Ngành nghề nổi bật" 
              description="Khám phá các vị trí đang tuyển dụng theo lĩnh vực bạn quan tâm"
              centered
            />
            
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/candidate?categoryId=${cat.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-border group h-full">
                      <CardHeader className="flex flex-row items-center gap-4 pb-4">
                        <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          {getDepartmentIcon(cat.name)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{cat.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">Xem chi tiết tuyển dụng</p>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>Khám phá tất cả các vị trí việc làm đang mở trên hệ thống</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/candidate">Xem danh sách việc làm</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Sẵn sàng để phát triển sự nghiệp?</h2>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
              Tham gia ngay hôm nay để trải nghiệm công cụ tìm kiếm việc làm thông minh và kết nối với các doanh nghiệp hàng đầu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="font-semibold" asChild>
                <Link href="/register/candidate">Tìm công việc phù hợp</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 font-semibold" asChild>
                <Link href="/register/recruiter">Đăng tin tuyển dụng</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
