// Generated types from Swagger JSON

export enum OrderStatus {
  Pending = 1,
  Processing = 2,
  Shipped = 3,
  Completed = 4,
  Cancelled = 5,
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
  orderStatus: OrderStatus;
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
