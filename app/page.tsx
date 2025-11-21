"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Trophy, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/shared/ProductGrid";
import { ProductGridSkeleton } from "@/components/shared/ProductSkeleton";
import { useFeaturedProducts, useCategories } from "@/lib/api/hooks";

import logo from "@/app/img/logopickleball.png";
import pick1 from "@/app/img/pickleball_img/pick1.jpg";
import pic2 from "@/app/img/pickleball_img/pic2.jpg";
import pic4 from "@/app/img/pickleball_img/pic4.jpg";
import pic5 from "@/app/img/pickleball_img/pic5.jpg";

const brandPromises = [
  {
    icon: ShieldCheck,
    title: "Chính hãng 100%",
    description: "Hợp tác trực tiếp cùng IKA Sport và các nhà phân phối lớn.",
  },
  {
    icon: Sparkles,
    title: "Chọn lọc tinh tế",
    description: "Các combo paddle, giày, phụ kiện theo từng trình độ.",
  },
  {
    icon: Zap,
    title: "Giao nhanh nội thành",
    description: "Nhận hàng trong 24h tại các thành phố lớn trên toàn quốc.",
  },
];

const communityStats = [
  { label: "Paddle đã giao", value: "12K+" },
  { label: "CLB đồng hành", value: "180+" },
  { label: "Khách hàng hài lòng", value: "4.9/5" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#f3fff5] via-white to-[#e4f6ea]">
      <HeroSection />

      <div className="container mx-auto px-4 pb-20 space-y-16">
        <BrandPromises />

        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">
                Sản phẩm nổi bật
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-emerald-950">
                Sẵn sàng ra sân ngay hôm nay
              </h2>
            </div>
            <Link href="/products">
              <Button
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-400 hover:text-white"
              >
                Xem tất cả sản phẩm
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,118,110,0.12)]">
            <FeaturedProducts />
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">
                Danh mục
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-emerald-950">
                Lên đồ theo phong cách Pickleball của bạn
              </h2>
            </div>
          </div>
          <CategoriesGrid />
        </section>
        
        <CommunitySection />
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden px-4 pt-16 pb-24 md:pt-24 md:pb-32">
      {/* Background with image overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/90 via-white/80 to-emerald-100/90 z-0" />
        <Image
          src={pick1}
          alt="Pickleball Court"
          fill
          className="object-cover opacity-20 mix-blend-overlay"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,214,154,0.3),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(90,225,144,0.18),transparent_55%)] blur-3xl" />
      </div>
      
      <div className="container relative mx-auto grid gap-12 md:grid-cols-2 md:items-center z-10">
        <div className="text-emerald-950 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold tracking-wide text-emerald-600 shadow-sm">
            <Image
              src={logo}
              alt="IKA Sport Pickleball"
              width={32}
              height={32}
              className="h-6 w-6 rounded-full bg-emerald-50 object-contain p-0.5"
              priority
            />
            IKA Sport Pickleball
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight text-emerald-950">
            Bùng nổ phong cách Pickleball với sắc trắng xanh IKA
          </h1>
          <p className="text-base text-emerald-900/80 max-w-xl">
            Trang bị paddle, giày, thời trang và phụ kiện đồng bộ sắc trắng –
            xanh mint tinh tế, nhẹ nhàng nhưng vẫn bùng nổ hiệu suất trên sân.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/products">
              <Button className="bg-emerald-500 text-white hover:bg-emerald-400 text-base px-6 py-4 h-auto shadow-lg">
                Mua ngay
              </Button>
            </Link>
            <Link
              href="/products?categoryId=paddles"
              className="flex items-center text-emerald-700 font-semibold hover:text-emerald-900 text-sm"
            >
              Khám phá paddle cao cấp
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2 text-xs text-emerald-900/80">
            {communityStats.map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-semibold text-emerald-600">
                  {stat.value}
                </p>
                <p className="text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-full">
          {/* Image Gallery */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-white shadow-xl max-w-lg mx-auto">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="relative aspect-square">
                <Image
                  src={pic2}
                  alt="Pickleball Balls"
                  fill
                  className="object-cover"
                  quality={90}
                />
              </div>
              <div className="relative aspect-square">
                <Image
                  src={pic4}
                  alt="Pickleball Paddle and Ball"
                  fill
                  className="object-cover"
                  quality={90}
                />
              </div>
              <div className="relative aspect-square col-span-2">
                <Image
                  src={pic5}
                  alt="Pickleball Equipment"
                  fill
                  className="object-cover"
                  quality={90}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 via-transparent to-transparent flex items-end p-3">
                  <div className="text-white">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                      Phong độ sân đấu
                    </p>
                    <p className="text-lg font-semibold mt-0.5">
                      Bộ sưu tập 2025
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating card */}
          <div className="absolute -bottom-4 -left-4 right-4 md:right-auto md:w-64 rounded-xl border border-emerald-100 bg-white/95 backdrop-blur-sm p-4 shadow-[0_20px_60px_rgba(15,118,110,0.15)]">
            <div className="space-y-2">
              <HighlightBadge
                title="Paddle Carbon Wave"
                description="Cân bằng lực – kiểm soát spin vượt trội"
              />
              <HighlightBadge
                title="Giày Court Sprint"
                description="Êm ái, bám sân & phối màu trắng xanh"
              />
            </div>
            <div className="mt-3 flex justify-between items-center rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
              <div>
                <p className="text-xs text-emerald-800/80">Phiên bản giới hạn</p>
                <p className="text-base font-semibold text-emerald-900">
                  IKA Daylight Set
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center text-emerald-700 hover:text-emerald-900 font-semibold text-xs"
              >
                Xem ngay
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HighlightBadge({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 shadow-inner">
      <p className="text-base font-semibold text-emerald-900">{title}</p>
      <p className="text-xs text-emerald-800/80">{description}</p>
    </div>
  );
}

function BrandPromises() {
  return (
    <section className="grid gap-6 md:grid-cols-3">
      {brandPromises.map((promise) => (
        <div
          key={promise.title}
          className="rounded-3xl border border-emerald-100 bg-white p-6 text-emerald-900 shadow-[0_15px_30px_rgba(15,118,110,0.1)]"
        >
          <promise.icon className="h-10 w-10 text-emerald-500" />
          <h3 className="mt-4 text-2xl font-semibold">{promise.title}</h3>
          <p className="mt-2 text-emerald-900/80">{promise.description}</p>
        </div>
      ))}
    </section>
  );
}

function FeaturedProducts() {
  const { data: products, isLoading, isError } = useFeaturedProducts(8);

  if (isLoading) {
    return <ProductGridSkeleton count={8} />;
  }

  if (isError || !products || products.length === 0) {
    return (
      <div className="text-center py-8 text-emerald-900/60">
        Không có sản phẩm nổi bật.
      </div>
    );
  }

  return <ProductGrid products={products} />;
}

function CategoriesGrid() {
  const { data: categories, isLoading, isError } = useCategories();

  if (isLoading) {
    return (
      <div className="text-center py-12 text-emerald-900/70">
        Đang tải danh mục…
      </div>
    );
  }

  if (isError || !categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products?categoryId=${category.id}`}
          className="group"
        >
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 transition duration-300 group-hover:-translate-y-1 group-hover:border-emerald-300 group-hover:shadow-[0_15px_30px_rgba(15,118,110,0.15)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(119,227,171,0.15),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-emerald-950">
                  {category.name}
                </h3>
                <span className="rounded-full border border-emerald-200 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-600">
                  Go
                </span>
              </div>
              <p className="mt-2 text-sm text-emerald-900/70">
                {category.productCount} sản phẩm
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function CommunitySection() {
  const highlights = [
    {
      title: "Huấn luyện viên đồng hành",
      description: "Kết nối người chơi với network HLV Pickleball toàn quốc.",
    },
    {
      title: "Gói club tailor-made",
      description:
        "Thiết kế combo thiết bị riêng cho từng câu lạc bộ với bảng màu IKA.",
    },
    {
      title: "Workshop trải nghiệm",
      description: "Demo paddle mới, test bóng & kỹ thuật ngay tại sân của bạn.",
    },
  ];

  return (
    <section className="rounded-3xl border border-emerald-100 bg-linear-to-br from-white via-[#f0fff4] to-[#e6f6ec] p-8 text-emerald-900 shadow-[0_25px_60px_rgba(15,118,110,0.15)]">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">
            Cộng đồng Pickleball
          </p>
          <h2 className="text-3xl font-bold mt-2 text-emerald-950">
            IKA Sport đồng hành cùng từng trận đấu của bạn
          </h2>
        </div>
        <Link href="/account/orders">
          <Button className="bg-emerald-500 text-white hover:bg-emerald-400">
            Theo dõi đơn hàng
          </Button>
        </Link>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_15px_40px_rgba(15,118,110,0.08)]"
          >
            <Trophy className="h-8 w-8 text-emerald-500" />
            <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
            <p className="mt-2 text-emerald-900/80">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

