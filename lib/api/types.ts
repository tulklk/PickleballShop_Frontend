// Generated types from Swagger JSON

export enum OrderStatus {
  Processing = 1,        // Đang xử lý (thay thế Pending)
  Confirmed = 2,          // Đã xác nhận
  Prepared = 3,           // Đã chuẩn bị hàng (mới)
  Shipped = 4,            // Đã giao cho đơn vị vận chuyển (thay thế Shipping)
  Completed = 5,          // Hoàn thành
  Cancelled = 6,          // Đã hủy
}

export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Processing]: 'Đang xử lý',
  [OrderStatus.Confirmed]: 'Đã xác nhận',
  [OrderStatus.Prepared]: 'Đã chuẩn bị hàng',
  [OrderStatus.Shipped]: 'Đã giao cho đơn vị vận chuyển',
  [OrderStatus.Completed]: 'Hoàn thành',
  [OrderStatus.Cancelled]: 'Đã hủy',
};

// Helper function để normalize order status từ backend (có thể là string hoặc number)
export function normalizeOrderStatus(status: string | number): OrderStatus {
  // Nếu backend trả về string
  if (typeof status === 'string') {
    const statusMap: Record<string, OrderStatus> = {
      'Pending': OrderStatus.Processing,    // Pending cũ → Processing mới
      'Shipping': OrderStatus.Shipped,     // Shipping cũ → Shipped mới
      'Confirmed': OrderStatus.Confirmed,
      'Completed': OrderStatus.Completed,
      'Cancelled': OrderStatus.Cancelled,
      // Enum mới
      'Processing': OrderStatus.Processing,
      'Prepared': OrderStatus.Prepared,
      'Shipped': OrderStatus.Shipped,
    };
    return statusMap[status] || OrderStatus.Processing;
  }
  
  // Nếu backend trả về number (enum value)
  if (typeof status === 'number') {
    // 1 = Processing (không đổi)
    // 2 = Confirmed (không đổi)
    // 3 = Prepared (mới, thay Shipping)
    // 4 = Shipped (mới, thay Shipping)
    // 5 = Completed (không đổi)
    // 6 = Cancelled (không đổi)
    // Map giá trị cũ sang mới nếu cần
    if (status === 1 && status !== OrderStatus.Processing) {
      // Nếu có giá trị cũ là 1 (Pending) thì chuyển sang Processing
      return OrderStatus.Processing;
    }
    if (status === 3 && status !== OrderStatus.Prepared) {
      // Nếu có giá trị cũ là 3 (Shipping) thì chuyển sang Shipped
      return OrderStatus.Shipped;
    }
    return status as OrderStatus;
  }
  
  return OrderStatus.Processing;
}

export enum PaymentStatus {
  Pending = 1,
  Processing = 2,
  Completed = 3,
  Failed = 4,
}

export enum PaymentMethod {
  COD = 0,
  MoMo = 1,
  VNPay = 2,
  BankTransfer = 3,
}

export type ProductType = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type SkillLevel = 1 | 2 | 3;
export type WeightRange = 1 | 2 | 3;
export type SurfaceType = 1 | 2 | 3;
export type Role = 1 | 2; // 1=Customer, 2=Admin

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
  email: string;
}

export interface ResendVerificationEmailRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  role: string | null;
  avatarUrl?: string | null;
}

export interface User {
  id: string;
  email: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  role: Role | null;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserRequest {
  email?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean;
  avatar?: string | null;
}

export interface CategoryDto {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  subCategories: CategoryDto[] | null;
  productCount: number;
}

// Category tree shape from /api/categories/tree
export interface CategoryTreeDto {
  id?: string;
  name?: string | null;
  description?: string | null;
  productCount?: number;
  children?: CategoryTreeDto[] | null;
}

// Admin create category: payload with children
export interface AdminCategoryChildRequest {
  name: string;
  description?: string | null;
}

export interface AdminCreateCategoryRequest {
  name: string;
  description?: string | null;
  children?: AdminCategoryChildRequest[] | null;
}

export interface AdminUpdateCategoryRequest {
  name: string;
  description?: string | null;
  children?: AdminCategoryChildRequest[] | null;
}

export interface ProductListDto {
  id: string;
  name: string | null;
  slug: string | null;
  price: number;
  originalPrice: number | null;
  stockQuantity: number;
  brand: string | null;
  productType: string | null;
  primaryImageUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
}

export interface ProductListDtoPagedResultDto {
  items: ProductListDto[] | null;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Product Variant DTO
export interface ProductVariantDto {
  id: string;
  productId: string;
  color: string | null;
  size: string | null;
  spec: string | null;
  price: number;
  originalPrice: number | null;
  stockQuantity: number;
  sku: string | null;
  isActive: boolean;
  displayName?: string | null; // For display purposes: "Màu: Đỏ, Thông số: 13mm"
}

export interface ProductDto {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  categoryId: string;
  categoryName: string | null;
  price: number;
  originalPrice: number | null;
  stockQuantity: number;
  sku: string | null;
  brand: string | null;
  isActive: boolean;
  productType: string | null;
  skillLevel: string | null;
  weightRange: string | null;
  surfaceType: string | null;
  material: string | null;
  imageUrls: string[] | null;
  primaryImageUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  createdAt: string;
  hasVariants?: boolean; // NEW: Product có variants hay không
  variants?: ProductVariantDto[] | null; // NEW: Danh sách variants
  specifications?: ProductSpecification[] | null; // Thông số kỹ thuật (đã sắp xếp theo displayOrder)
}

export interface ProductCategory {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  parentCategoryId: string | null;
}

// Product Variant for Create/Update (without id and productId)
export interface ProductVariantCreateDto {
  color?: string | null;
  size?: string | null;
  spec?: string | null;
  price: number;
  originalPrice?: number | null;
  stockQuantity: number;
  sku: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  categoryId: string;
  price: number;
  originalPrice: number | null;
  stockQuantity: number;
  sku: string | null;
  brand: string | null;
  isActive: boolean;
  productType: ProductType;
  skillLevel: SkillLevel;
  weightRange: WeightRange;
  surfaceType: SurfaceType;
  material: string | null;
  imageUrls?: string[] | null; // For admin create/update
  variants?: ProductVariantCreateDto[] | null; // For admin create/update
}

export interface CartDto {
  id: string;
  items: CartItemDto[] | null;
  subTotal: number;
  totalItems: number;
}

export interface CartItemDto {
  id: string;
  productId: string;
  productVariantId?: string | null; // NEW: Variant ID nếu có
  productName: string | null;
  productImageUrl: string | null;
  variantInfo?: string | null; // NEW: Thông tin variant hiển thị: "Màu: Đỏ, Thông số: 13mm"
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface AddCartItemRequest {
  productId: string;
  productVariantId?: string | null; // NEW: Variant ID nếu product có variants
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface ShippingAddressDto {
  fullName: string | null;
  phoneNumber: string | null;
  addressLine: string | null;
  ward: string | null;
  district: string | null;
  city: string | null;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddressDto;
  paymentMethod: PaymentMethod;
  // Mã giảm giá (nếu có) khi tạo đơn cho user đã đăng nhập
  voucherCode?: string | null;
}

export interface GuestOrderItem {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
}

export interface GuestShippingAddress {
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
}

export interface CreateGuestOrderRequest {
  email: string;
  fullName: string;
  shippingAddress: GuestShippingAddress;
  paymentMethod: number; // 0=COD, 1=MoMo, 2=VNPay, 3=PayOS
  items: GuestOrderItem[];
  // Mã giảm giá (nếu có) khi tạo đơn cho khách vãng lai
  voucherCode?: string | null;
}

export interface OrderDto {
  id: string;
  orderNumber: string | null;
  totalAmount: number;
  paymentStatus: string | null;
  orderStatus: string | null;
  paymentMethod: string | null;
  shippingAddress: ShippingAddressDto;
  items: OrderItemDto[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productVariantId?: string | null; // NEW: Variant ID nếu có
  productName: string | null;
  productImageUrl: string | null;
  variantInfo?: string | null; // NEW: Thông tin variant hiển thị
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface BankTransferInfo {
  qrDataUrl: string;
  qrCode: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  transferContent: string;
}

export interface PayOSResponse {
  checkoutUrl: string;
  qrCode: string;
}

export interface CreatePaymentResponse {
  paymentUrl: string | null;
  orderId: string;
  orderNumber: string | null;
  isCod?: boolean;
  isBankTransfer?: boolean;
  bankTransferInfo?: BankTransferInfo;
  // PayOS response
  success?: boolean;
  payOSResponse?: PayOSResponse;
}

export interface UpdateOrderStatusRequest {
  status: string; // Backend expects string like "Processing", "Confirmed", etc.
}

// Admin Order type (different from OrderDto)
export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderNumber: string | null;
  userId: string;
  totalAmount: number;
  paymentStatus: PaymentStatus | string; // Backend may return string like "Pending"
  orderStatus: OrderStatus | string; // Backend may return string like "Confirmed"
  paymentMethod: PaymentMethod | string; // Backend may return string like "COD"
  paymentTransactionId: string | null;
  shippingFullName: string | null;
  shippingPhoneNumber: string | null;
  shippingAddressLine: string | null;
  shippingWard: string | null;
  shippingDistrict: string | null;
  shippingCity: string | null;
  user?: {
    id: string;
    email: string | null;
    fullName: string | null;
    phoneNumber: string | null;
  } | null;
  shippingAddress?: ShippingAddressDto | null;
  items?: OrderItem[] | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  productVariantId?: string | null; // NEW: Variant ID nếu có
  productName: string | null;
  productImageUrl: string | null;
  variantInfo?: string | null; // NEW: Thông tin variant hiển thị
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface UpdatePaymentStatusRequest {
  paymentStatus: PaymentStatus;
}

// Response khi tạo đơn hàng (backend có thể trả về cấu trúc này)
export interface CreateOrderResponse {
  order: OrderDto;
  payment?: CreatePaymentResponse;
}

// ===== Vouchers =====

// Backend có thể trả về DiscountType dạng string (theo Swagger: "Percent", "Fixed")
// hoặc số (theo database: int4). Để an toàn chúng ta cho phép cả hai.
export type DiscountType = "Percent" | "Fixed" | "FixedAmount" | number | string;

export interface Voucher {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isPublic: boolean;
  usageLimitTotal?: number | null;
  usageLimitPerCustomer?: number | null;
  usedCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PagedVoucherResponse {
  items: Voucher[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateVoucherRequest {
  code: string;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isPublic: boolean;
  usageLimitTotal?: number | null;
  usageLimitPerCustomer?: number | null;
}

export interface UpdateVoucherRequest extends CreateVoucherRequest {}

// Apply voucher cho user đã đăng nhập
export interface ApplyVoucherRequest {
  code: string;
}

export interface ApplyVoucherResponse {
  code?: string;
  discountAmount: number;
  finalTotal: number;
  message?: string | null;
}

// Guest apply voucher – theo mô tả: email + items + code
export interface GuestApplyVoucherItem {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
}

export interface GuestApplyVoucherRequest {
  email: string;
  items: GuestApplyVoucherItem[];
  code: string;
}

export interface GuestApplyVoucherResponse extends ApplyVoucherResponse {}

// ===== Product Specifications =====

export interface ProductSpecification {
  id: string;
  productId: string;
  key: string;
  value: string;
  displayOrder: number;
}

export interface CreateProductSpecificationRequest {
  key: string;
  value: string;
  displayOrder: number;
}

export interface UpdateProductSpecificationRequest extends CreateProductSpecificationRequest {}

export interface BulkUpdateProductSpecificationsRequest {
  specifications: CreateProductSpecificationRequest[];
}

// Wishlist
export interface WishlistItem {
  id: string;
  productId: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Backend returns full Product in Wishlist.product; we keep it flexible here
  product?: ProductDto | null;
}

// Product Comments
export interface ProductComment {
  id: string;
  productId: string;
  userId?: string;
  parentCommentId?: string | null;
  content: string;
  isEdited?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Optional extra fields if backend returns user info / nested replies
  userFullName?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
  isAdmin?: boolean;
  replies?: ProductComment[];
}

// Product Reviews
export interface ProductReview {
  id: string;
  productId: string;
  userId?: string | null;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  rating: number;
  comment: string | null;
  reviewImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewResponse {
  reviews: ProductReview[];
  averageRating: number;
  reviewCount: number;
  ratingDistribution: {
    [key: number]: number; // rating: count
  };
}

export interface CreateProductReviewRequest {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  rating: number;
  comment?: string | null;
  reviewImageUrl?: string | null;
}

// Chat
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatMessageRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatMessageResponse {
  message: string;
  conversationId?: string;
  // Optional product suggestions from backend
  suggestedProducts?: Array<{
    id: string;
    name: string;
    brand?: string;
    price?: number;
    originalPrice?: number | null;
    imageUrls?: string[] | null;
    stockQuantity?: number | null;
  }>;
}

// Support Chat (Admin <-> Customer)
export interface SupportMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string | null;
  isFromAdmin: boolean;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface SupportConversationDto {
  id: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  customerUnreadCount: number;
  adminUnreadCount: number;
  createdAt: string;
}

export interface SupportConversationMessagesDto {
  conversation: SupportConversationDto | null;
  messages: SupportMessageDto[];
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// News
export interface NewsListDto {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  thumbnailUrl: string;
  authorName: string;
  category: string;
  isPublished: boolean;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
}

export interface NewsDto {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML content
  summary: string | null;
  thumbnailUrl: string;
  authorId: string;
  authorName: string;
  category: string;
  tags: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PagedNewsResponse {
  items: NewsListDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateNewsRequest {
  title: string;
  content: string;
  summary?: string | null;
  thumbnailUrl: string;
  category: string;
  tags?: string | null;
  isPublished: boolean;
}

export interface UpdateNewsRequest {
  title: string;
  content: string;
  summary?: string | null;
  thumbnailUrl: string;
  category: string;
  tags?: string | null;
  isPublished: boolean;
}
