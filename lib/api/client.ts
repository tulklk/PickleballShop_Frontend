import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  AuthResponse,
  CategoryDto,
  ProductListDtoPagedResultDto,
  ProductDto,
  ProductCategory,
  Product,
  CartDto,
  AddCartItemRequest,
  UpdateCartItemRequest,
  CartItemDto,
  CreateOrderRequest,
  OrderDto,
  CreatePaymentResponse,
  UpdateOrderStatusRequest,
  OrderStatus,
  PaymentStatus,
  GoogleLoginRequest,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://pickleballshop-backend-1.onrender.com";

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken");
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("accessToken", token);
      } else {
        localStorage.removeItem("accessToken");
      }
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    if (options.headers) {
      const extraHeaders = new Headers(options.headers as HeadersInit);
      extraHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiError(response.status, response.statusText, errorData);
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/Auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const payload: GoogleLoginRequest = { idToken };
    return this.request<AuthResponse>("/api/Auth/google-login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/Auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/Auth/refresh", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async logout(data: RefreshTokenRequest): Promise<void> {
    return this.request<void>("/api/Auth/logout", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Categories endpoints
  async getCategories(): Promise<CategoryDto[]> {
    return this.request<CategoryDto[]>("/api/Categories");
  }

  async getCategoryById(id: string): Promise<CategoryDto> {
    return this.request<CategoryDto>(`/api/Categories/${id}`);
  }

  async getCategoryBySlug(slug: string): Promise<CategoryDto> {
    return this.request<CategoryDto>(`/api/Categories/slug/${slug}`);
  }

  // Products endpoints
  async getProducts(params?: {
    Page?: number;
    PageSize?: number;
    CategoryId?: string;
    MinPrice?: number;
    MaxPrice?: number;
    SortBy?: string;
    ProductType?: string;
    SkillLevel?: string;
    Brand?: string;
    SearchTerm?: string;
  }): Promise<ProductListDtoPagedResultDto> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<ProductListDtoPagedResultDto>(
      `/api/Products${query ? `?${query}` : ""}`
    );
  }

  async getProductById(id: string): Promise<ProductDto> {
    return this.request<ProductDto>(`/api/Products/${id}`);
  }

  async getProductBySlug(slug: string): Promise<ProductDto> {
    return this.request<ProductDto>(`/api/Products/slug/${slug}`);
  }

  async getFeaturedProducts(count?: number): Promise<ProductDto[]> {
    const query = count ? `?count=${count}` : "";
    return this.request<ProductDto[]>(`/api/Products/featured${query}`);
  }

  async searchProducts(params?: {
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ProductDto[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<ProductDto[]>(
      `/api/Products/search${query ? `?${query}` : ""}`
    );
  }

  // Cart endpoints
  async getCart(): Promise<CartDto> {
    return this.request<CartDto>("/api/Cart");
  }

  async addCartItem(data: AddCartItemRequest): Promise<CartItemDto> {
    return this.request<CartItemDto>("/api/Cart/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCartItem(
    cartItemId: string,
    data: UpdateCartItemRequest
  ): Promise<CartItemDto> {
    return this.request<CartItemDto>(`/api/Cart/items/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCartItem(cartItemId: string): Promise<void> {
    return this.request<void>(`/api/Cart/items/${cartItemId}`, {
      method: "DELETE",
    });
  }

  async clearCart(): Promise<void> {
    return this.request<void>("/api/Cart", {
      method: "DELETE",
    });
  }

  // Orders endpoints
  async createOrder(data: CreateOrderRequest): Promise<OrderDto> {
    return this.request<OrderDto>("/api/Orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMyOrders(): Promise<OrderDto[]> {
    return this.request<OrderDto[]>("/api/Orders/my");
  }

  async getOrderById(id: string): Promise<OrderDto> {
    return this.request<OrderDto>(`/api/Orders/${id}`);
  }

  async createPayment(orderId: string): Promise<CreatePaymentResponse> {
    return this.request<CreatePaymentResponse>(`/api/Orders/${orderId}/payment`, {
      method: "POST",
    });
  }

  // Admin endpoints
  async adminGetCategories(): Promise<ProductCategory[]> {
    return this.request<ProductCategory[]>("/api/admin/AdminCategories");
  }

  async adminGetCategoryById(id: string): Promise<ProductCategory> {
    return this.request<ProductCategory>(`/api/admin/AdminCategories/${id}`);
  }

  async adminCreateCategory(data: ProductCategory): Promise<ProductCategory> {
    return this.request<ProductCategory>("/api/admin/AdminCategories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async adminUpdateCategory(
    id: string,
    data: ProductCategory
  ): Promise<void> {
    return this.request<void>(`/api/admin/AdminCategories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async adminDeleteCategory(id: string): Promise<void> {
    return this.request<void>(`/api/admin/AdminCategories/${id}`, {
      method: "DELETE",
    });
  }

  async adminGetOrders(params?: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<OrderDto[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<OrderDto[]>(
      `/api/admin/AdminOrders${query ? `?${query}` : ""}`
    );
  }

  async adminGetOrderById(id: string): Promise<OrderDto> {
    return this.request<OrderDto>(`/api/admin/AdminOrders/${id}`);
  }

  async adminUpdateOrderStatus(
    id: string,
    data: UpdateOrderStatusRequest
  ): Promise<void> {
    return this.request<void>(`/api/admin/AdminOrders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async adminGetProducts(): Promise<Product[]> {
    return this.request<Product[]>("/api/admin/AdminProducts");
  }

  async adminGetProductById(id: string): Promise<Product> {
    return this.request<Product>(`/api/admin/AdminProducts/${id}`);
  }

  async adminCreateProduct(data: Product): Promise<Product> {
    return this.request<Product>("/api/admin/AdminProducts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async adminUpdateProduct(id: string, data: Product): Promise<void> {
    return this.request<void>(`/api/admin/AdminProducts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async adminDeleteProduct(id: string): Promise<void> {
    return this.request<void>(`/api/admin/AdminProducts/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { ApiError };

