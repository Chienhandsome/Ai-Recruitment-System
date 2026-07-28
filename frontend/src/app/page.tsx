import Link from "next/link"
import { Search, MapPin, Briefcase, Code, Megaphone, Users, Calculator, Palette, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionHeading } from "@/components/common/section-heading"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { MOCK_DEPARTMENTS, MOCK_FEATURED_JOBS } from "@/constants/mock-data"

export default function HomePage() {
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
              <div className="bg-surface p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Chức danh, kỹ năng, tên công ty..." 
                    className="pl-10 h-12 text-base border-0 focus-visible:ring-0 bg-muted/50" 
                  />
                </div>
                <div className="hidden md:block w-px bg-border my-2"></div>
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Tất cả địa điểm" 
                    className="pl-10 h-12 text-base border-0 focus-visible:ring-0 bg-muted/50" 
                  />
                </div>
                <Button className="h-12 px-8 text-base shrink-0 w-full md:w-auto">
                  Tìm việc
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Departments */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading 
              title="Phòng ban nổi bật" 
              description="Khám phá các vị trí đang tuyển dụng theo lĩnh vực bạn quan tâm"
              centered
            />
            
            {MOCK_DEPARTMENTS.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {MOCK_DEPARTMENTS.map((dept) => (
                  <Card key={dept.id} className="hover:shadow-md transition-shadow cursor-pointer border-border group">
                    <CardHeader className="flex flex-row items-center gap-4 pb-4">
                      <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        {getDepartmentIcon(dept.name)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{dept.jobCount} việc làm</p>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">Hệ thống chưa có danh mục phòng ban.</div>
            )}
          </div>
        </section>

        {/* Featured Jobs */}
        <section className="py-20 bg-surface-container">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10">
              <SectionHeading 
                title="Việc làm hấp dẫn" 
                description="Các cơ hội nghề nghiệp tốt nhất dành cho bạn hôm nay"
                className="mb-0"
              />
              <Button variant="link" className="hidden md:flex mt-4 md:mt-0 px-0">
                Xem tất cả <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {MOCK_FEATURED_JOBS.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {MOCK_FEATURED_JOBS.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow flex flex-col h-full border-border">
                    <CardHeader>
                      {job.isUrgent && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Tuyển gấp
                          </span>
                        </div>
                      )}
                      <CardTitle className="text-xl line-clamp-2">{job.title}</CardTitle>
                      <div className="text-sm text-primary font-medium mt-2">{job.department}</div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Briefcase className="mr-2 h-4 w-4" />
                        {job.type}
                      </div>
                      {job.salary && (
                        <div className="font-semibold text-foreground mt-2">
                          {job.salary}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between items-center border-t border-border/50 pt-4 mt-4">
                      <span className="text-xs text-muted-foreground">{job.postedAt}</span>
                      <Button variant="secondary" size="sm">Ứng tuyển</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-background">
                Hiện tại chưa có bài đăng tuyển dụng công khai nào.
              </div>
            )}
            <div className="mt-8 text-center md:hidden">
              <Button variant="outline" className="w-full">
                Xem tất cả việc làm
              </Button>
            </div>
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
