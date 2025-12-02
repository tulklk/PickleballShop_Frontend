import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  AuthResponse,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationEmailRequest,
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
    "https://pickleballshop-backend.fly.dev";
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
      let errorText = "";
      
      try {
        errorText = await response.text();
        
        // Handle empty error response
        if (!errorText || errorText.trim() === "") {
          // Provide meaningful error messages based on status code
          if (response.status === 401) {
            errorData = { 
              message: "Bạn cần đăng nhập để thực hiện thao tác này. Vui lòng đăng nhập lại." 
            };
          } else if (response.status === 403) {
            errorData = { 
              message: "Bạn không có quyền thực hiện thao tác này." 
            };
          } else if (response.status === 404) {
            errorData = { 
              message: "Không tìm thấy tài nguyên yêu cầu." 
            };
          } else if (response.status >= 500) {
            errorData = { 
              message: "Lỗi máy chủ. Vui lòng thử lại sau." 
            };
          } else {
            errorData = { 
              message: response.statusText || `Lỗi ${response.status}` 
            };
          }
        } else {
          // Try to parse as JSON
          try {
            errorData = JSON.parse(errorText);
          } catch {
            // If not JSON, use text as message
            errorData = { message: errorText };
          }
        }
      } catch (readError) {
        // If we can't read response, provide default error
        if (response.status === 401) {
          errorData = { 
            message: "Bạn cần đăng nhập để thực hiện thao tác này. Vui lòng đăng nhập lại." 
          };
        } else {
          errorData = { 
            message: response.statusText || "Không thể đọc phản hồi lỗi từ máy chủ" 
          };
        }
      }
      
      // Extract error message
      let errorMessage = "Unknown error";
      if (errorData && typeof errorData === "object") {
        if ("message" in errorData && errorData.message) {
          errorMessage = String(errorData.message);
        } else if ("error" in errorData && errorData.error) {
          errorMessage = String(errorData.error);
        } else if ("title" in errorData && errorData.title) {
          errorMessage = String(errorData.title);
        }
      }
      
      // Provide friendly Vietnamese error messages for common status codes
      if (response.status === 401) {
        // Clear tokens on 401 error
        this.setAccessToken(null);
        this.setRefreshToken(null);
        
        errorMessage = errorMessage.includes("đăng nhập") 
          ? errorMessage 
          : "Bạn cần đăng nhập để thực hiện thao tác này. Vui lòng đăng nhập lại.";
      } else if (response.status === 403) {
        errorMessage = errorMessage.includes("quyền") 
          ? errorMessage 
          : "Bạn không có quyền thực hiện thao tác này.";
      }
      
      // Debug logging (use console.warn to avoid Next.js error overlay)
      if (process.env.NODE_ENV === "development") {
        console.warn(`[API Error] ${response.status} ${response.statusText}`, {
          url,
          errorMessage,
          errorData,
          errorText: errorText ? errorText.substring(0, 500) : "", // Log first 500 chars if available
        });
      }
      
      throw new ApiError(response.status, errorMessage, errorData);
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    let text = await response.text();
    
    if (!text || text.trim() === "") {
      if (process.env.NODE_ENV === "development") {
        console.log(`[API Response] Empty response for ${url} - returning empty result`);
      }
      // For void return types (like PUT/DELETE), return undefined
      // For other types, return empty array or empty object based on expected type
      return undefined as T;
    }

    // Clean the text: remove BOM, trim whitespace, remove control characters
    text = text.trim();
    
    // Remove BOM (Byte Order Mark) if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }
    
    // Check if response looks like HTML (error page)
    if (text.trim().startsWith("<") || text.toLowerCase().includes("<!doctype")) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[API Response] HTML response received for ${url}. First 500 chars:`, text.substring(0, 500));
      }
      // Try to extract error message from HTML
      const errorMatch = text.match(/<title[^>]*>(.*?)<\/title>/i) || text.match(/<h1[^>]*>(.*?)<\/h1>/i);
      const errorMessage = errorMatch ? errorMatch[1] : "Server returned HTML instead of JSON";
      throw new ApiError(response.status, errorMessage, { responseText: text.substring(0, 1000) });
    }
    
    // Check content type
    if (contentType && !contentType.includes("application/json") && !contentType.includes("text/json")) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[API Response] Non-JSON content-type for ${url}:`, contentType);
        console.warn(`[API Response] Response preview:`, text.substring(0, 200));
      }
      // Still try to parse if it looks like JSON
      if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
        throw new ApiError(response.status, `Expected JSON but got ${contentType}`, { contentType, responseText: text.substring(0, 500) });
      }
    }

    // Try to parse JSON
    try {
      // Additional validation: check if text looks like JSON
      const trimmedText = text.trim();
      
      // Check if response is too large (might indicate an issue)
      if (trimmedText.length > 10000000) { // 10MB limit
        throw new Error("Response is too large to parse safely");
      }
      
      if (!trimmedText.startsWith("{") && !trimmedText.startsWith("[")) {
        throw new Error("Response does not start with { or [");
      }

      // Validate JSON structure before parsing (basic check)
      const openBraces = (trimmedText.match(/{/g) || []).length;
      const closeBraces = (trimmedText.match(/}/g) || []).length;
      const openBrackets = (trimmedText.match(/\[/g) || []).length;
      const closeBrackets = (trimmedText.match(/\]/g) || []).length;
      
      if (trimmedText.startsWith("{")) {
        if (Math.abs(openBraces - closeBraces) > 5) {
          throw new Error(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
        }
      } else if (trimmedText.startsWith("[")) {
        if (Math.abs(openBrackets - closeBrackets) > 5) {
          throw new Error(`Mismatched brackets: ${openBrackets} open, ${closeBrackets} close`);
        }
      }

      // Use trimmedText for parsing to avoid issues with leading/trailing whitespace
      const json = JSON.parse(trimmedText);
      if (process.env.NODE_ENV === "development") {
        console.log(`[API Response] Successfully parsed JSON for ${url} (${trimmedText.length} chars)`);
      }
      return json;
    } catch (parseError: any) {
      // Enhanced error logging with detailed information (use console.warn to avoid Next.js error overlay)
      const errorMessage = parseError.message || "Unknown JSON parse error";
      const positionMatch = errorMessage.match(/position (\d+)/);
      const errorPosition = positionMatch ? parseInt(positionMatch[1]) : null;
      
      // Use console.warn instead of console.error to avoid Next.js error overlay
      if (process.env.NODE_ENV === "development") {
        console.warn(`[API Response] Failed to parse JSON for ${url}:`);
        console.warn(`  Error:`, errorMessage);
        console.warn(`  Response length:`, text.length);
        
        if (errorPosition !== null && errorPosition !== undefined) {
          const start = Math.max(0, errorPosition - 150);
          const end = Math.min(text.length, errorPosition + 150);
          console.warn(`  Error at position:`, errorPosition);
          console.warn(`  Context around error position:`);
          console.warn(`  ...${text.substring(start, end)}...`);
          console.warn(`  Character at position ${errorPosition}:`, `"${text[errorPosition]}" (char code: ${text.charCodeAt(errorPosition)})`);
          
          // Try to find the line and column
          const beforeError = text.substring(0, errorPosition);
          const lineNumber = (beforeError.match(/\n/g) || []).length + 1;
          const lastNewline = beforeError.lastIndexOf('\n');
          const columnNumber = errorPosition - lastNewline;
          console.warn(`  Approximate line: ${lineNumber}, column: ${columnNumber}`);
        } else {
          console.warn(`  Response preview (first 1500 chars):`, text.substring(0, 1500));
        }
      }
      
      // Check for common JSON issues and provide friendly error messages
      let friendlyErrorMessage = "Invalid JSON response from server";
      if (errorMessage.includes("Expected ',' or '}'")) {
        friendlyErrorMessage = "JSON syntax error: Missing comma or closing brace. The server response may be malformed.";
      } else if (errorMessage.includes("Unexpected token")) {
        friendlyErrorMessage = "JSON syntax error: Unexpected token found in response.";
      } else if (errorMessage.includes("Unexpected end")) {
        friendlyErrorMessage = "JSON syntax error: Response appears to be truncated.";
      }
      
      throw new ApiError(
        response.status || 500, 
        friendlyErrorMessage,
        { 
          parseError: errorMessage,
          responseLength: text.length,
          errorPosition: errorPosition,
          responsePreview: errorPosition 
            ? text.substring(Math.max(0, errorPosition - 500), Math.min(text.length, errorPosition + 500))
            : text.substring(0, Math.min(1000, text.length)),
          fullResponse: text.length < 50000 ? text : undefined // Only include full response if it's not too large
        }
      );
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

  async verifyEmail(data: VerifyEmailRequest): Promise<void> {
    return this.request<void>("/api/Auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async resendVerificationEmail(data: ResendVerificationEmailRequest): Promise<void> {
    return this.request<void>("/api/Auth/resend-verification", {
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

    // Handle variants if provided
    if ((data as any).variants !== undefined) {
      payload.variants = (data as any).variants;
    }

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

    // Handle variants for update:
    // - Only add variants field if it's explicitly provided
    // - If undefined, don't add it = keep existing variants
    // - If null or [], add it = remove all variants
    // - If [...], add it = replace all variants
    if ((data as any).variants !== undefined) {
      payload.variants = (data as any).variants;
    }

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

  // Admin user management endpoints
  async adminGetUsers(): Promise<User[]> {
    // Use admin-specific endpoint for listing users in admin panel
    return this.request<User[]>(`/api/admin/AdminUsers`);
  }

  async adminUpdateUserStatus(id: string, isActive: boolean): Promise<void> {
    // Dedicated endpoint for updating user's active status
    const payload = { isActive: Boolean(isActive) };
    return this.request<void>(`/api/admin/AdminUsers/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { ApiError };

