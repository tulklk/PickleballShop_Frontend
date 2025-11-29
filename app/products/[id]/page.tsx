"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useProduct, useAddCartItem, useProducts } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ShoppingCart, ChevronLeft, ChevronRight, X, ZoomIn, Star, MessageCircle, Send, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/useAuth";
import { addToGuestCart } from "@/lib/utils/guestCart";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { data: product, isLoading } = useProduct(productId);
  const addCartItem = useAddCartItem();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"detail" | "specs" | "reviews" | "qa">("detail");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [email, setEmail] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerPhone, setReviewerPhone] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [saveReviewerInfo, setSaveReviewerInfo] = useState(false);

  // Fetch related products (same category)
  const { data: relatedProductsData } = useProducts({
    CategoryId: product?.categoryId,
    PageSize: 5,
  });

  // Build images array - must be before useCallback hooks
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EProduct Image%3C/text%3E%3C/svg%3E";
  
  const allImages: string[] = [];
  if (product?.primaryImageUrl) {
    allImages.push(product.primaryImageUrl);
  }
  if (product?.imageUrls && product.imageUrls.length > 0) {
    product.imageUrls.forEach((img) => {
      if (!allImages.includes(img)) {
        allImages.push(img);
      }
    });
  }
  if (allImages.length === 0) {
    allImages.push(placeholderImage);
  }

  const currentImage = allImages[selectedImageIndex] || placeholderImage;

  const goToPrevImage = useCallback(() => {
    setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const goToNextImage = useCallback(() => {
    setSelectedImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  const handleAddToCart = async () => {
    if (!product) {
      toast.error("Không tìm thấy sản phẩm");
      return;
    }

    // If not authenticated, save to localStorage (guest cart)
    if (!isAuthenticated) {
      addToGuestCart({
        productId: product.id,
        quantity,
        productName: product.name || undefined,
        productImageUrl: product.primaryImageUrl || product.imageUrls?.[0] || undefined,
        unitPrice: product.price,
      });
      toast.success("Đã thêm vào giỏ hàng! Đăng nhập để thanh toán.");
      // Invalidate cart query to update cart count in navbar
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      return;
    }

    // If authenticated, use API
    try {
      await addCartItem.mutateAsync({
        productId: product.id,
        quantity,
      });
      toast.success("Đã thêm vào giỏ hàng!");
    } catch (error: any) {
      // If API fails, fallback to guest cart
      if (error?.status === 500 || error?.status >= 500) {
        console.warn("API failed, saving to guest cart as fallback:", error);
        addToGuestCart({
          productId: product.id,
          quantity,
          productName: product.name || undefined,
          productImageUrl: product.primaryImageUrl || product.imageUrls?.[0] || undefined,
          unitPrice: product.price,
        });
        toast.warning("Đã lưu vào giỏ hàng tạm thời. Vui lòng thử lại sau.");
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      } else {
        const errorMessage = 
          error?.data?.message || error?.message || "Không thể thêm vào giỏ hàng";
        toast.error(errorMessage);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-12 w-48" />
            <Card className="border-emerald-100">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">Product not found.</div>
    );
  }

  // Helper to render image (handles Cloudinary URLs)
  const renderImage = (src: string, alt: string, fill: boolean = true, className: string = "") => {
    if (src.includes("cloudinary.com") || src.startsWith("data:")) {
      return (
        <img
          src={src}
          alt={alt}
          className={`${fill ? "absolute inset-0 w-full h-full" : ""} ${className}`}
          style={fill ? { objectFit: "contain" } : {}}
        />
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={className}
        sizes="(max-width: 768px) 100vw, 50vw"
        style={{ objectFit: "contain" }}
      />
    );
  };

  const ratingLabels = ["", "Rất tệ", "Không tệ", "Trung bình", "Tốt", "Tuyệt vời"];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Review Modal */}
      {isReviewModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsReviewModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Đánh giá {product?.name}</h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsReviewModalOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Review Text */}
              <div>
                <Textarea
                  placeholder="Mời bạn chia sẻ thêm một số cảm nhận..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  className="w-full"
                />
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 text-sm text-emerald-600 cursor-pointer">
                    <input type="checkbox" className="text-emerald-600" />
                    <span>📷 Gửi ảnh thực tế</span>
                  </label>
                  <span className="text-sm text-gray-400">
                    {reviewText.length} ký tự (Tối thiểu 10)
                  </span>
                </div>
              </div>

              {/* Rating Stars */}
              <div>
                <p className="text-sm font-medium mb-3">
                  Bạn cảm thấy thế nào về sản phẩm?<br />
                  <span className="text-gray-500">(Chọn sao)</span>
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="text-center">
                      <button
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-10 w-10 transition-colors ${
                            star <= reviewRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 hover:text-yellow-300"
                          }`}
                        />
                      </button>
                      <p className="text-xs text-gray-500 mt-1">{ratingLabels[star]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Họ tên*"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                />
                <Input
                  placeholder="Số điện thoại*"
                  value={reviewerPhone}
                  onChange={(e) => setReviewerPhone(e.target.value)}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                />
              </div>

              {/* Save Info Checkbox */}
              <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveReviewerInfo}
                  onChange={(e) => setSaveReviewerInfo(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Lưu tên của tôi, email, và trang web trong trình duyệt này cho lần bình luận kế tiếp của tôi.
                </span>
              </label>

              {/* Submit Button */}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-3"
                onClick={() => {
                  if (!reviewerName || !reviewerPhone) {
                    toast.error("Vui lòng nhập họ tên và số điện thoại");
                    return;
                  }
                  if (reviewText.length < 10) {
                    toast.error("Nội dung đánh giá phải có ít nhất 10 ký tự");
                    return;
                  }
                  toast.success("Đánh giá của bạn đã được gửi thành công!");
                  setIsReviewModalOpen(false);
                  setReviewText("");
                  setReviewRating(5);
                  setReviewerName("");
                  setReviewerPhone("");
                  setReviewerEmail("");
                }}
              >
                GỬI ĐÁNH GIÁ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X className="h-8 w-8" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 text-white text-lg font-medium">
            {selectedImageIndex + 1} / {allImages.length}
          </div>

          {/* Previous button */}
          {allImages.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-3 text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevImage();
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Main image */}
          <div 
            className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {currentImage.includes("cloudinary.com") || currentImage.startsWith("data:") ? (
              <img
                src={currentImage}
                alt={product.name || "Product"}
                className="max-w-full max-h-[85vh] object-contain"
              />
            ) : (
              <Image
                src={currentImage}
                alt={product.name || "Product"}
                width={1200}
                height={1200}
                className="max-w-full max-h-[85vh] object-contain"
                priority
              />
            )}
          </div>

          {/* Next button */}
          {allImages.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-3 text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                goToNextImage();
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  className={`relative w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                    idx === selectedImageIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(idx);
                  }}
                >
                  {img.includes("cloudinary.com") || img.startsWith("data:") ? (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          {/* Main Image with Navigation */}
          <div className="relative aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden group">
            {/* Main Image - Clickable to open lightbox */}
            <div 
              className="relative w-full h-full cursor-zoom-in"
              onClick={() => setIsLightboxOpen(true)}
            >
              {renderImage(currentImage, product.name || "Product", true, "rounded-lg")}
              
              {/* Zoom icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                <ZoomIn className="h-10 w-10 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
              </div>
            </div>

            {/* Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevImage();
                  }}
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextImage();
                  }}
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>
              </>
            )}

            {/* Image counter badge */}
            {allImages.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-sm px-2 py-1 rounded">
                {selectedImageIndex + 1} / {allImages.length}
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === selectedImageIndex
                      ? "border-emerald-500 ring-2 ring-emerald-200"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                  onClick={() => setSelectedImageIndex(idx)}
                >
                  {img.includes("cloudinary.com") || img.startsWith("data:") ? (
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <Image
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">{product.name}</h1>
          
          {/* Rating & Sold Count */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="font-bold text-emerald-600">{product.averageRating?.toFixed(1) || "5.0"}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= (product.averageRating || 5)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-blue-500 text-sm hover:underline cursor-pointer">({product.reviewCount || 0} đánh giá)</span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500 text-sm">Đã bán {product.reviewCount || 0}</span>
          </div>

          {/* Price Box with Gradient */}
          <div className="bg-gradient-to-r from-emerald-500 to-lime-400 rounded-lg p-4 mb-4">
            <p className="text-white/90 text-sm mb-1">Giá khuyến mãi:</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-white">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg text-white/70 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-white/90 text-sm mt-1">
                Tiết kiệm: <span className="font-semibold">{formatCurrency(product.originalPrice - product.price)}</span>
              </p>
            )}
          </div>

          {/* Discount Badge on Image */}
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            </div>
          )}

          {/* Extra Benefits */}
          <Card className="mb-4 border-emerald-100">
            <CardContent className="p-4">
              <p className="font-semibold text-gray-700 mb-2">Ưu đãi thêm:</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-emerald-500">✓</span>
                <span>Freeship khi thanh toán trước đơn hàng</span>
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <div className="space-y-2 mb-4 text-sm">
            {product.brand && (
              <div className="flex">
                <span className="text-gray-500 w-24">Thương hiệu:</span>
                <span className="font-medium text-emerald-600">{product.brand}</span>
              </div>
            )}
            <div className="flex">
              <span className="text-gray-500 w-24">Tình trạng:</span>
              <span className={product.stockQuantity > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {product.stockQuantity > 0 ? "Còn hàng" : "Hết hàng"}
              </span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-gray-700">Số lượng:</label>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none h-10 w-10"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                -
              </Button>
              <span className="w-14 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none h-10 w-10"
                onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
              >
                +
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              onClick={() => {
                handleAddToCart();
                router.push("/checkout");
              }}
              disabled={addCartItem.isPending || product.stockQuantity === 0}
            >
              MUA NGAY
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600"
              onClick={handleAddToCart}
              disabled={addCartItem.isPending || product.stockQuantity === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {addCartItem.isPending ? "Đang thêm..." : "THÊM VÀO GIỎ HÀNG"}
            </Button>
          </div>

          {/* Contact Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-blue-500 text-blue-500 hover:bg-blue-50"
              onClick={() => window.open("https://zalo.me", "_blank")}
            >
              <Image
                src="/img/zalo_icon.png"
                alt="Zalo"
                width={20}
                height={20}
                className="mr-2"
              />
              Tư vấn qua Zalo
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => window.open("https://facebook.com", "_blank")}
            >
              <Image
                src="/img/fb_icon.png"
                alt="Facebook"
                width={20}
                height={20}
                className="mr-2"
              />
              Tư vấn qua Facebook
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-12 border-t pt-8">
        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 border-b">
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "detail"
                ? "bg-emerald-600 text-white rounded-t-lg"
                : "text-gray-600 hover:text-emerald-600"
            }`}
            onClick={() => setActiveTab("detail")}
          >
            CHI TIẾT SẢN PHẨM
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "specs"
                ? "bg-emerald-600 text-white rounded-t-lg"
                : "text-gray-600 hover:text-emerald-600"
            }`}
            onClick={() => setActiveTab("specs")}
          >
            THÔNG SỐ KỸ THUẬT
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "reviews"
                ? "bg-emerald-600 text-white rounded-t-lg"
                : "text-gray-600 hover:text-emerald-600"
            }`}
            onClick={() => setActiveTab("reviews")}
          >
            ĐÁNH GIÁ ({product.reviewCount || 0})
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "qa"
                ? "bg-emerald-600 text-white rounded-t-lg"
                : "text-gray-600 hover:text-emerald-600"
            }`}
            onClick={() => setActiveTab("qa")}
          >
            HỎI ĐÁP
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* Chi tiết sản phẩm */}
          {activeTab === "detail" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">{product.name}</h2>
                {product.description ? (
                  <div className="prose max-w-none">
                    {(() => {
                      // Parse description into sections based on numbered headings (1., 2., 3., etc.)
                      const sections: Array<{ title: string; content: string; index: number }> = [];
                      const lines = product.description.split('\n');
                      let currentSection: { title: string; content: string; index: number } | null = null;
                      
                      lines.forEach((line) => {
                        // Check if line starts with a number followed by a dot (e.g., "1.", "2.", "3.")
                        const headingMatch = line.match(/^(\d+)\.\s*(.+)$/);
                        if (headingMatch) {
                          // Save previous section if exists
                          if (currentSection) {
                            sections.push(currentSection);
                          }
                          // Start new section
                          currentSection = {
                            title: headingMatch[2].trim(),
                            content: '',
                            index: parseInt(headingMatch[1], 10)
                          };
                        } else if (currentSection) {
                          // Add line to current section content
                          currentSection.content += (currentSection.content ? '\n' : '') + line;
                        } else {
                          // If no section started yet, create a default one
                          if (sections.length === 0) {
                            currentSection = {
                              title: '',
                              content: line,
                              index: 0
                            };
                          } else {
                            // Add to last section
                            if (sections.length > 0) {
                              sections[sections.length - 1].content += '\n' + line;
                            }
                          }
                        }
                      });
                      
                      // Add last section
                      if (currentSection) {
                        sections.push(currentSection);
                      }
                      
                      // If no sections found, treat entire description as one section
                      if (sections.length === 0) {
                        sections.push({
                          title: '',
                          content: product.description,
                          index: 0
                        });
                      }
                      
                      return sections.map((section, sectionIdx) => {
                        // Get image for this section (cycle through available images)
                        const imageIndex = sectionIdx % allImages.length;
                        const sectionImage = allImages[imageIndex];
                        
                        return (
                          <div key={sectionIdx} className="mb-8 last:mb-0">
                            {/* Section Title */}
                            {section.title && (
                              <h3 className="text-lg font-semibold text-emerald-900 mb-3">
                                {section.index > 0 ? `${section.index}. ` : ''}{section.title}
                              </h3>
                            )}
                            
                            {/* Section Content */}
                            <div className="text-gray-700 whitespace-pre-line leading-relaxed mb-4">
                              {section.content.trim()}
                            </div>
                            
                            {/* Product Image after each section */}
                            {sectionImage && (
                              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 mb-6">
                                {sectionImage.includes("cloudinary.com") || sectionImage.startsWith("data:") ? (
                                  <img 
                                    src={sectionImage} 
                                    alt={section.title || product.name} 
                                    className="w-full h-full object-contain" 
                                  />
                                ) : (
                                  <Image 
                                    src={sectionImage} 
                                    alt={section.title || product.name} 
                                    fill 
                                    className="object-contain" 
                                    sizes="100vw" 
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Chưa có mô tả chi tiết cho sản phẩm này.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Thông số kỹ thuật */}
          {activeTab === "specs" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Thông số kỹ thuật</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 bg-gray-50 font-medium w-1/3">Tên sản phẩm</td>
                        <td className="py-3 px-4">{product.name}</td>
                      </tr>
                      {product.brand && (
                        <tr className="border-b">
                          <td className="py-3 px-4 bg-gray-50 font-medium">Thương hiệu</td>
                          <td className="py-3 px-4">{product.brand}</td>
                        </tr>
                      )}
                      {product.productType && (
                        <tr className="border-b">
                          <td className="py-3 px-4 bg-gray-50 font-medium">Loại sản phẩm</td>
                          <td className="py-3 px-4">{product.productType}</td>
                        </tr>
                      )}
                      <tr className="border-b">
                        <td className="py-3 px-4 bg-gray-50 font-medium">Tình trạng</td>
                        <td className="py-3 px-4">
                          {product.stockQuantity > 0 ? (
                            <span className="text-green-600">Còn hàng</span>
                          ) : (
                            <span className="text-red-600">Hết hàng</span>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 bg-gray-50 font-medium">Giá bán</td>
                        <td className="py-3 px-4 text-emerald-600 font-bold">{formatCurrency(product.price)}</td>
                      </tr>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <tr className="border-b">
                          <td className="py-3 px-4 bg-gray-50 font-medium">Giá gốc</td>
                          <td className="py-3 px-4 text-gray-500 line-through">{formatCurrency(product.originalPrice)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Đánh giá */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              {/* Rating Summary */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Average Rating */}
                    <div className="text-center md:border-r md:pr-8">
                      <div className="text-5xl font-bold text-emerald-600">
                        {product.averageRating?.toFixed(1) || "0.0"}
                      </div>
                      <div className="flex justify-center gap-1 my-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= (product.averageRating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">ĐÁNH GIÁ TRUNG BÌNH</p>
                      <p className="text-sm text-gray-500">{product.reviewCount || 0} đánh giá</p>
                    </div>

                    {/* Rating Bars */}
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-8 text-sm">{star} ⭐</span>
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full"
                              style={{
                                width: star === 5 ? "100%" : "0%",
                              }}
                            />
                          </div>
                          <span className="w-20 text-sm text-gray-500">
                            {star === 5 ? `100% | ${product.reviewCount || 0} đánh giá` : "0% | 0 đánh giá"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Write Review Button */}
                    <div className="text-center">
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setIsReviewModalOpen(true)}
                      >
                        ĐÁNH GIÁ NGAY
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sample Reviews */}
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-500 italic text-center py-8">Chưa có đánh giá nào cho sản phẩm này.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Hỏi đáp */}
          {activeTab === "qa" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Đặt câu hỏi về sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Mời bạn tham gia thảo luận, vui lòng nhập tiếng Việt có dấu."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={3}
                  />
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="gender" defaultChecked className="text-emerald-600" />
                        <span>Anh</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="gender" className="text-emerald-600" />
                        <span>Chị</span>
                      </label>
                    </div>
                    <Input placeholder="Họ tên*" className="flex-1 min-w-[150px]" />
                    <Input placeholder="Email" className="flex-1 min-w-[150px]" />
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      GỬI
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-500 italic text-center py-8">Không có bình luận nào</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProductsData?.items && relatedProductsData.items.length > 1 && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">SẢN PHẨM TƯƠNG TỰ</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProductsData.items
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((relatedProduct) => {
                const relatedImage = relatedProduct.primaryImageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23e5e7eb'/%3E%3C/svg%3E";
                return (
                  <Link
                    key={relatedProduct.id}
                    href={`/products/${relatedProduct.id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative aspect-square bg-gray-100">
                        {relatedImage.includes("cloudinary.com") || relatedImage.startsWith("data:") ? (
                          <img
                            src={relatedImage}
                            alt={relatedProduct.name || ""}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Image
                            src={relatedImage}
                            alt={relatedProduct.name || ""}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="25vw"
                          />
                        )}
                        {relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.price && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                            -{Math.round((1 - relatedProduct.price / relatedProduct.originalPrice) * 100)}%
                          </span>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-emerald-600">
                          {relatedProduct.name}
                        </h3>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= (relatedProduct.averageRating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-600 font-bold">
                            {formatCurrency(relatedProduct.price)}
                          </span>
                          {relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.price && (
                            <span className="text-gray-400 text-sm line-through">
                              {formatCurrency(relatedProduct.originalPrice)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* Newsletter Section */}
      <div className="mt-12 border-t pt-8">
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="p-8">
            <div className="max-w-2xl mx-auto text-center">
              <Mail className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Đăng ký nhận thông tin</h2>
              <p className="text-gray-600 mb-6">
                Nhận các chương trình khuyến mãi, thông báo sản phẩm mới và các ưu đãi khác dành riêng cho bạn.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Nhập Email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    if (email) {
                      toast.success("Đăng ký nhận thông tin thành công!");
                      setEmail("");
                    } else {
                      toast.error("Vui lòng nhập email");
                    }
                  }}
                >
                  ĐĂNG KÝ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

