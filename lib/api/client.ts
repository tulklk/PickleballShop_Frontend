import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  AuthResponse,
  ChangePasswordRequest,
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
  CreateOrderResponse,
  OrderDto,
  Order,
  OrderItem,
  CreatePaymentResponse,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  GoogleLoginRequest,
  UserDto,
  User,
  UpdateUserRequest,
} from "./types";

// Ensure URL has protocol and no trailing slash
const getApiBaseUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://pickleballshop-backend.onrender.com";
  // Remove trailing slash if present
  return url.replace(/\/$/, "");
};

const API_BASE_URL = getApiBaseUrl();

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    // Don't include stack trace in message to avoid triggering Next.js error overlay
    super(`API Error: ${status}`);
    this.name = "ApiError";
    // Suppress error display in Next.js dev overlay
    if (typeof window !== "undefined" && (window as any).__NEXT_DATA__) {
      // Mark as handled to prevent Next.js error overlay
      (this as any).__NEXT_ERROR_HANDLED = true;
    }
  }
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    // Ensure baseURL has protocol
    if (!baseURL.startsWith("http://") && !baseURL.startsWith("https://")) {
      console.warn(`[API Client] Base URL missing protocol, defaulting to https://`);
      this.baseURL = `https://${baseURL}`;
    } else {
      this.baseURL = baseURL;
    }
    
    // Remove trailing slash
    this.baseURL = this.baseURL.replace(/\/$/, "");
    
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken");
    }
    
    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[API Client] Initialized with base URL: ${this.baseURL}`);
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

  setRefreshToken(token: string | null) {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("refreshToken", token);
      } else {
        localStorage.removeItem("refreshToken");
      }
    }
  }

  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refreshToken");
    }
    return null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${normalizedEndpoint}`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options.headers) {
      const extraHeaders = new Headers(options.headers as HeadersInit);
      extraHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    }

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[API Request] ${options.method || "GET"} ${url}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        const text = await response.text();
        // Try to parse as JSON, fallback to text
        try {
          errorData = text ? JSON.parse(text) : { message: "Empty response" };
        } catch {
          errorData = text || { message: "Unknown error occurred" };
        }
      } catch {
        errorData = { message: "Failed to read error response" };
      }
      
      // Debug logging in development (use console.warn to avoid triggering Next.js error overlay)
      if (process.env.NODE_ENV === "development") {
        console.warn(`[API Error] ${response.status} ${response.statusText}`, {
          url,
          errorData,
        });
      }
      
      // Create error with better message
      const errorMessage = 
        (errorData && typeof errorData === "object" && "message" in errorData)
          ? String(errorData.message)
          : response.statusText || "Unknown error";
      
      throw new ApiError(response.status, errorMessage, errorData);
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    const text = await response.text();
    
    if (!text || text.trim() === "") {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[API Response] Empty response for ${url}`);
      }
      return [] as T; // Return empty array for list endpoints
    }
    
    if (!contentType || !contentType.includes("application/json")) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[API Response] Non-JSON response for ${url}:`, contentType);
      }
      return {} as T;
    }

    try {
      const json = JSON.parse(text);
      if (process.env.NODE_ENV === "development") {
        console.log(`[API Response] ${url}:`, json);
      }
      return json;
    } catch (parseError) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[API Response] Failed to parse JSON for ${url}:`, parseError, text);
      }
      throw new ApiError(500, "Invalid JSON response", { text, parseError });
    }
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
    return this.request<AuthResponse>("/api/Auth/login/google", {
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

  async getCurrentUser(): Promise<UserDto> {
    return this.request<UserDto>("/api/Auth/me");
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return this.request<void>("/api/Users/me/change-password", {
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
  async createOrder(data: CreateOrderRequest): Promise<OrderDto | CreateOrderResponse> {
    const response = await this.request<OrderDto | CreateOrderResponse>("/api/Orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
    console.log("API createOrder raw response:", response);
    return response;
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
    // Use public Categories endpoint as admin endpoint doesn't have GET all
    // This endpoint should work with admin authentication
    try {
      const result = await this.request<CategoryDto[]>("/api/Categories");
      // Convert CategoryDto[] to ProductCategory[]
      return result.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parentCategoryId: cat.parentCategoryId,
      }));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      throw error;
    }
  }

  async adminGetCategoryById(id: string): Promise<ProductCategory> {
    return this.request<ProductCategory>(`/api/admin/AdminCategories/${id}`);
  }

  async adminCreateCategory(data: ProductCategory): Promise<ProductCategory> {
    const payload = {
      name: (data.name ?? "").trim(),
      description: data.description?.trim() || "",
    };

    return this.request<ProductCategory>("/api/admin/AdminCategories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async adminUpdateCategory(
    id: string,
    data: ProductCategory
  ): Promise<void> {
    const payload = {
      name: (data.name ?? "").trim(),
      description: data.description?.trim() || "",
    };

    return this.request<void>(`/api/admin/AdminCategories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
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
  }): Promise<Order[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    const endpoint = `/api/admin/AdminOrders${query ? `?${query}` : ""}`;
    
    try {
      const result = await this.request<Order[]>(endpoint);
      if (process.env.NODE_ENV === "development") {
        console.log("[adminGetOrders] Success:", result);
      }
      return result;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[adminGetOrders] Error:", error);
      }
      throw error;
    }
  }

  async adminGetOrderById(id: string): Promise<Order> {
    const endpoint = `/api/admin/AdminOrders/${id}`;
    
    try {
      // Backend may return OrderDto format (with shippingAddress) or Order format (with individual fields)
      // Accept any format and transform to Order
      const result = await this.request<any>(endpoint);
      
      if (process.env.NODE_ENV === "development") {
        console.log("[adminGetOrderById] Raw response:", result);
      }
      
      // Check if it has shippingAddress (OrderDto format) or individual fields (Order format)
      if (result.shippingAddress && typeof result.shippingAddress === "object") {
        // It's OrderDto format or has shippingAddress object, transform to Order format
        const order: Order = {
          id: result.id,
          createdAt: result.createdAt || result.createdAt,
          updatedAt: result.updatedAt || result.updatedAt,
          orderNumber: result.orderNumber,
          userId: result.userId || result.user?.id || "",
          totalAmount: result.totalAmount,
          paymentStatus: result.paymentStatus as PaymentStatus | string,
          orderStatus: result.orderStatus as OrderStatus | string,
          paymentMethod: result.paymentMethod as PaymentMethod | string,
          paymentTransactionId: result.paymentTransactionId || null,
          shippingFullName: result.shippingAddress?.fullName || result.shippingFullName || null,
          shippingPhoneNumber: result.shippingAddress?.phoneNumber || result.shippingPhoneNumber || null,
          shippingAddressLine: result.shippingAddress?.addressLine || result.shippingAddressLine || null,
          shippingWard: result.shippingAddress?.ward || result.shippingWard || null,
          shippingDistrict: result.shippingAddress?.district || result.shippingDistrict || null,
          shippingCity: result.shippingAddress?.city || result.shippingCity || null,
          user: result.user || null,
          shippingAddress: result.shippingAddress || null,
          items: result.items?.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName || item.productNameSnapshot || null,
            productImageUrl: item.productImageUrl || null,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })) || null,
        };
        
        if (process.env.NODE_ENV === "development") {
          console.log("[adminGetOrderById] Transformed to Order:", order);
        }
        
        return order;
      }
      
      // It's already Order format (has individual shipping fields)
      return result as Order;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[adminGetOrderById] Error:", error);
        console.error("[adminGetOrderById] Endpoint:", endpoint);
        if (error instanceof ApiError) {
          console.error("[adminGetOrderById] Error status:", error.status);
          console.error("[adminGetOrderById] Error data:", error.data);
        }
      }
      throw error;
    }
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

  async adminUpdatePaymentStatus(
    id: string,
    data: UpdatePaymentStatusRequest
  ): Promise<void> {
    return this.request<void>(`/api/admin/AdminOrders/${id}/payment-status`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async adminGetProducts(): Promise<Product[]> {
    // Try admin endpoint first, fallback to public Products endpoint
    try {
      // Try the admin endpoint if it exists (may not be in Swagger but might work)
      return await this.request<Product[]>("/api/admin/AdminProducts");
    } catch (error) {
      // Fallback to /api/Products endpoint with authentication for admin list
      // This endpoint returns paginated results
      const result = await this.request<ProductListDtoPagedResultDto>("/api/Products?PageSize=1000");
      if (!result.items || result.items.length === 0) {
        return [];
      }
      
      // Convert ProductListDto[] to Product[] with default values for missing fields
      return result.items.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: null,
        categoryId: "",
        price: item.price,
        originalPrice: item.originalPrice,
        stockQuantity: item.stockQuantity,
        sku: null,
        brand: item.brand,
        isActive: true,
        productType: (item.productType ? parseInt(item.productType) : 1) as any,
        skillLevel: 1 as any,
        weightRange: 2 as any,
        surfaceType: 1 as any,
        material: null,
      })) as Product[];
    }
  }

  async adminGetProductById(id: string): Promise<Product> {
    return this.request<Product>(`/api/admin/AdminProducts/${id}`);
  }

  async adminCreateProduct(data: Product): Promise<Product> {
    console.log("🔵 [adminCreateProduct] Input data:", JSON.stringify(data, null, 2));
    
    // Validate categoryId - must not be empty
    const categoryIdValue = data.categoryId || "";
    if (!categoryIdValue || categoryIdValue.trim() === "") {
      console.error("❌ [adminCreateProduct] categoryId is empty!");
      throw new Error("Category ID is required");
    }
    
    // Ensure data format matches backend expectations
    // Backend expects camelCase (not PascalCase) based on Swagger UI
    const trimmedCategoryId = categoryIdValue.trim();
    const payload: any = {
      name: data.name || "",
      description: data.description || null,
      categoryId: trimmedCategoryId,
      price: typeof data.price === "number" ? data.price : Number(data.price) || 0,
      originalPrice: data.originalPrice !== undefined && data.originalPrice !== null
        ? (typeof data.originalPrice === "number" ? data.originalPrice : Number(data.originalPrice))
        : null,
      stockQuantity: typeof data.stockQuantity === "number" ? data.stockQuantity : Number(data.stockQuantity) || 0,
      sku: data.sku || null,
      brand: data.brand || null,
      isActive: Boolean(data.isActive),
      // Ensure imageUrls is always an array of valid strings
      imageUrls: Array.isArray((data as any).imageUrls) 
        ? (data as any).imageUrls.filter((url: any): url is string => 
            typeof url === "string" && url.trim().length > 0
          )
        : [],
    };

    console.log("🔵 [adminCreateProduct] Final payload:", JSON.stringify(payload, null, 2));
    console.log("🔵 [adminCreateProduct] Payload types:", {
      name: typeof payload.name,
      categoryId: typeof payload.categoryId,
      price: typeof payload.price,
      stockQuantity: typeof payload.stockQuantity,
      isActive: typeof payload.isActive,
      imageUrls: typeof payload.imageUrls,
      imageUrlsIsArray: Array.isArray(payload.imageUrls),
      imageUrlsLength: payload.imageUrls ? payload.imageUrls.length : 0,
    });
    console.log("🔵 [adminCreateProduct] Sending POST to /api/admin/AdminProducts");

    try {
      const result = await this.request<Product>("/api/admin/AdminProducts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("✅ [adminCreateProduct] Success:", result);
      return result;
    } catch (error: any) {
      console.error("❌ [adminCreateProduct] Error:", error);
      console.error("❌ [adminCreateProduct] Error status:", error?.status);
      console.error("❌ [adminCreateProduct] Error data:", JSON.stringify(error?.data, null, 2));
      throw error;
    }
  }

  async adminUpdateProduct(id: string, data: Product): Promise<void> {
    console.log("🟡 [adminUpdateProduct] Product ID:", id);
    console.log("🟡 [adminUpdateProduct] Input data:", JSON.stringify(data, null, 2));
    
    // Validate categoryId - must not be empty
    const categoryIdValue = data.categoryId || "";
    if (!categoryIdValue || categoryIdValue.trim() === "") {
      console.error("❌ [adminUpdateProduct] categoryId is empty!");
      throw new Error("Category ID is required");
    }
    
    // Ensure data format matches backend expectations
    // Backend expects camelCase (not PascalCase) based on Swagger UI
    const trimmedCategoryId = categoryIdValue.trim();
    const payload: any = {
      name: data.name || "",
      description: data.description || null,
      categoryId: trimmedCategoryId,
      price: typeof data.price === "number" ? data.price : Number(data.price) || 0,
      originalPrice: data.originalPrice !== undefined && data.originalPrice !== null
        ? (typeof data.originalPrice === "number" ? data.originalPrice : Number(data.originalPrice))
        : null,
      stockQuantity: typeof data.stockQuantity === "number" ? data.stockQuantity : Number(data.stockQuantity) || 0,
      sku: data.sku || null,
      brand: data.brand || null,
      isActive: Boolean(data.isActive),
      // Ensure imageUrls is always an array of valid strings
      imageUrls: Array.isArray((data as any).imageUrls) 
        ? (data as any).imageUrls.filter((url: any): url is string => 
            typeof url === "string" && url.trim().length > 0
          )
        : [],
    };

    console.log("🟡 [adminUpdateProduct] Final payload:", JSON.stringify(payload, null, 2));
    console.log("🟡 [adminUpdateProduct] Payload types:", {
      name: typeof payload.name,
      categoryId: typeof payload.categoryId,
      categoryIdValue: payload.categoryId,
      categoryIdIsEmpty: !payload.categoryId || payload.categoryId === "",
      price: typeof payload.price,
      stockQuantity: typeof payload.stockQuantity,
      isActive: typeof payload.isActive,
      imageUrls: typeof payload.imageUrls,
      imageUrlsIsArray: Array.isArray(payload.imageUrls),
      imageUrlsLength: payload.imageUrls ? payload.imageUrls.length : 0,
    });
    console.log("🟡 [adminUpdateProduct] Sending PUT to /api/admin/AdminProducts/" + id);

    try {
      const result = await this.request<void>(`/api/admin/AdminProducts/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      console.log("✅ [adminUpdateProduct] Success");
      return result;
    } catch (error: any) {
      console.error("❌ [adminUpdateProduct] Error:", error);
      console.error("❌ [adminUpdateProduct] Error status:", error?.status);
      console.error("❌ [adminUpdateProduct] Error data:", JSON.stringify(error?.data, null, 2));
      throw error;
    }
  }

  async adminDeleteProduct(id: string): Promise<void> {
    return this.request<void>(`/api/admin/AdminProducts/${id}`, {
      method: "DELETE",
    });
  }

  // User endpoints
  async getUserMe(): Promise<User> {
    const response = await this.request<any>("/api/Users/me");
    // Map 'avatar' field from backend to 'avatarUrl' for User interface
    return {
      ...response,
      avatarUrl: response.avatar || response.avatarUrl || null,
    } as User;
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/api/Users/${id}`);
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>("/api/Users");
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<void> {
    if (process.env.NODE_ENV === "development") {
      console.log("[ApiClient] updateUser called:", {
        id,
        data,
        stringified: JSON.stringify(data),
      });
    }
    return this.request<void>(`/api/Users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/api/Users/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { ApiError };

