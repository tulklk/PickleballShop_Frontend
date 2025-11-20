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
  COD = 1,
  MoMo = 2,
  VNPay = 3,
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
}

export interface ProductCategory {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  parentCategoryId: string | null;
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
  productName: string | null;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface AddCartItemRequest {
  productId: string;
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
  productName: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CreatePaymentResponse {
  paymentUrl: string | null;
  orderId: string;
  orderNumber: string | null;
}

export interface UpdateOrderStatusRequest {
  orderStatus: OrderStatus;
}
