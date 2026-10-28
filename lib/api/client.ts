import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  AuthResponse,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  PayosConfirmResponse,
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
  CreateGuestOrderRequest,
  CreateOrderResponse,
  OrderDto,
  Order,
  OrderItem,
  CreatePaymentResponse,
  UpdateOrderStatusRequest,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  GoogleLoginRequest,
  UserDto,
  User,
  UpdateUserRequest,
  WishlistItem,
  ChatMessageRequest,
  ChatMessageResponse,
  ProductComment,
  ProductReview,
  ProductReviewResponse,
  CreateProductReviewRequest,
  NewsListDto,
  NewsDto,
  PagedNewsResponse,
  CreateNewsRequest,
  UpdateNewsRequest,
  CategoryTreeDto,
  AdminCreateCategoryRequest,
  AdminUpdateCategoryRequest,
  // Voucher types
  Voucher,
  PagedVoucherResponse,
  CreateVoucherRequest,
  UpdateVoucherRequest,
  ApplyVoucherRequest,
  ApplyVoucherResponse,
  GuestApplyVoucherRequest,
  GuestApplyVoucherResponse,
  // Product Specification types
  ProductSpecification,
  CreateProductSpecificationRequest,
  UpdateProductSpecificationRequest,
  BulkUpdateProductSpecificationsRequest,
} from "./types";
import { DEBUG_API } from "@/lib/utils/debugApi";
import { sanitizeGuestOrderPayload, sanitizeOrderItems } from "@/lib/utils/orderPayload";
import { MAX_PAGE_SIZE, normalizeQueryValue } from "@/lib/utils/pagination";

// Ensure URL has protocol and no trailing slash
const getApiBaseUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://pickleballshop-backend.fly.dev";
  // Remove trailing slash if present
  return url.replace(/\/$/, "");
};

const API_BASE_URL = getApiBaseUrl();

/** Endpoint xác thực: 401 ở đây là "sai thông tin/token", KHÔNG được kích hoạt refresh hay logout. */
const AUTH_ENDPOINT_RE = /\/api\/auth\/(login|register|refresh|forgot-password|reset-password|verify-email|resend-verification)/i;

/** Sự kiện phát ra khi phiên hết hạn không thể khôi phục (refresh thất bại). */
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

/** Đọc header Retry-After (giây hoặc HTTP-date) -> số giây, giới hạn 1..3600. */
export function parseRetryAfter(value: string | null | undefined, now: number = Date.now()): number | undefined {
  if (!value) return undefined;
  const v = value.trim();
  let seconds: number;
  if (/^\d+$/.test(v)) {
    seconds = parseInt(v, 10);
  } else {
    const t = Date.parse(v);
    if (Number.isNaN(t)) return undefined;
    seconds = Math.ceil((t - now) / 1000);
  }
  if (!Number.isFinite(seconds)) return undefined;
  return Math.min(3600, Math.max(1, seconds));
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
    /** Với HTTP 429: số giây cần chờ (từ header Retry-After). */
    public retryAfterSeconds?: number
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
      if (DEBUG_API) {
        console.warn(`[API Client] Base URL missing protocol, defaulting to https://`);
      }
      this.baseURL = `https://${baseURL}`;
    } else {
      this.baseURL = baseURL;
    }
    
    // Remove trailing slash
    this.baseURL = this.baseURL.replace(/\/$/, "");
    
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken");
    }
    
    if (DEBUG_API) {
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

  private refreshPromise: Promise<boolean> | null = null;

  /**
   * Làm mới phiên bằng refresh token (single-flight: nhiều request 401 cùng lúc chỉ gọi refresh 1 lần).
   * Refresh token XOAY VÒNG: luôn lưu cả access + refresh token MỚI, bỏ token cũ.
   * Trả về true nếu thành công; nếu thất bại thì xóa phiên và phát SESSION_EXPIRED_EVENT.
   */
  refreshSession(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return Promise.resolve(false);

    this.refreshPromise = (async () => {
      try {
        const res = await this.request<AuthResponse>("/api/Auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
        if (!res?.accessToken) throw new Error("Empty refresh response");
        this.setAccessToken(res.accessToken);
        if (res.refreshToken) this.setRefreshToken(res.refreshToken);
        return true;
      } catch (error) {
        const status = (error as { status?: number })?.status;
        // Lỗi mạng/5xx/429 tạm thời: giữ phiên, để lần sau thử lại. 400/401/403: refresh token vô hiệu.
        if (status === undefined || status >= 500 || status === 429) return false;
        this.clearSession();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }

  /** Xóa token và báo cho UI (xóa cache, chuyển tới /login). */
  clearSession() {
    this.setAccessToken(null);
    this.setRefreshToken(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    hasRetried = false
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

    if (DEBUG_API) {
      console.log(`[API Request] ${options.method || "GET"} ${url}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // 401 với access token hết hạn/thu hồi: thử refresh đúng 1 lần rồi gửi lại request gốc.
      if (
        response.status === 401 &&
        !hasRetried &&
        this.accessToken &&
        !AUTH_ENDPOINT_RE.test(normalizedEndpoint)
      ) {
        const refreshed = await this.refreshSession();
        if (refreshed) {
          return this.request<T>(endpoint, options, true);
        }
        // Refresh không khả dụng: phiên đã được xóa trong refreshSession (nếu token vô hiệu).
        if (!this.getRefreshToken()) this.clearSession();
      }

      const retryAfterSeconds =
        response.status === 429 ? parseRetryAfter(response.headers.get("retry-after")) : undefined;

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
      let detailedErrors: any = null;
      
      if (errorData && typeof errorData === "object") {
        // Check for validation errors (usually in 'errors' field)
        if ("errors" in errorData && errorData.errors) {
          detailedErrors = errorData.errors;
          // Format validation errors into readable message
          if (typeof errorData.errors === "object") {
            const errorMessages: string[] = [];
            for (const [key, value] of Object.entries(errorData.errors)) {
              if (Array.isArray(value)) {
                errorMessages.push(`${key}: ${value.join(", ")}`);
              } else if (typeof value === "string") {
                errorMessages.push(`${key}: ${value}`);
              }
            }
            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join("; ");
            }
          }
        }
        
        // Extract main error message
        if ("message" in errorData && errorData.message) {
          errorMessage = String(errorData.message);
        } else if ("error" in errorData && errorData.error) {
          errorMessage = String(errorData.error);
        } else if ("title" in errorData && errorData.title) {
          errorMessage = String(errorData.title);
        } else if ("detail" in errorData && errorData.detail) {
          errorMessage = String(errorData.detail);
        }
        
      }
      
      // Provide friendly Vietnamese error messages for common status codes
      if (response.status === 429) {
        errorMessage = retryAfterSeconds
          ? `Bạn thao tác quá nhanh, vui lòng thử lại sau ${retryAfterSeconds} giây.`
          : "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.";
      } else if (response.status === 401) {
        // Token đã được xử lý ở trên (refresh/clear). Endpoint đăng nhập giữ message gốc của server.
        if (!AUTH_ENDPOINT_RE.test(normalizedEndpoint)) {
          errorMessage = errorMessage.includes("đăng nhập") 
            ? errorMessage 
            : "Bạn cần đăng nhập để thực hiện thao tác này. Vui lòng đăng nhập lại.";
        }
      } else if (response.status === 403) {
        errorMessage = errorMessage.includes("quyền") 
          ? errorMessage 
          : "Bạn không có quyền thực hiện thao tác này.";
      } else if (response.status === 500) {
        // For 500 errors, provide more context if available
        if (!errorMessage || errorMessage === "Unknown error") {
          errorMessage = "Lỗi máy chủ. Vui lòng kiểm tra dữ liệu và thử lại.";
        }
      }
      
      if (DEBUG_API) {
        console.warn(`[API Error] ${response.status} ${response.statusText}`, {
          url,
          errorMessage,
          errorData,
          errorText: errorText ? errorText.substring(0, 500) : "",
        });
      }
      
      if (response.status === 429) {
        // Các form đọc `error.data.message` => đảm bảo luôn là thông báo thân thiện.
        errorData = { message: errorMessage, retryAfterSeconds };
      }

      throw new ApiError(response.status, errorMessage, errorData, retryAfterSeconds);
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    let text = await response.text();
    
    if (!text || text.trim() === "") {
      if (DEBUG_API) {
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
      if (DEBUG_API) {
        console.warn(`[API Response] HTML response received for ${url}. First 500 chars:`, text.substring(0, 500));
      }
      // Try to extract error message from HTML
      const errorMatch = text.match(/<title[^>]*>(.*?)<\/title>/i) || text.match(/<h1[^>]*>(.*?)<\/h1>/i);
      const errorMessage = errorMatch ? errorMatch[1] : "Server returned HTML instead of JSON";
      throw new ApiError(response.status, errorMessage, { responseText: text.substring(0, 1000) });
    }
    
    // Check content type
    if (contentType && !contentType.includes("application/json") && !contentType.includes("text/json")) {
      if (DEBUG_API) {
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
      if (DEBUG_API) {
        console.log(`[API Response] Successfully parsed JSON for ${url} (${trimmedText.length} chars)`);
      }
      return json;
    } catch (parseError: any) {
      // Enhanced error logging with detailed information (use console.warn to avoid Next.js error overlay)
      const errorMessage = parseError.message || "Unknown JSON parse error";
      const positionMatch = errorMessage.match(/position (\d+)/);
      const errorPosition = positionMatch ? parseInt(positionMatch[1]) : null;
      
      if (DEBUG_API) {
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

          const beforeError = text.substring(0, errorPosition);
          const lineNumber = (beforeError.match(/\n/g) || []).length + 1;
          const lastNewline = beforeError.lastIndexOf("\n");
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

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    return this.request<void>("/api/Auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    return this.request<void>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Categories endpoints
  async getCategories(): Promise<CategoryDto[]> {
    return this.request<CategoryDto[]>("/api/Categories");
  }

  async getCategoryTree(): Promise<CategoryTreeDto[]> {
    return this.request<CategoryTreeDto[]>("/api/categories/tree");
  }

  async getCategoryById(id: string): Promise<CategoryDto> {
    return this.request<CategoryDto>(`/api/Categories/${encodeURIComponent(id)}`);
  }

  async getCategoryBySlug(slug: string): Promise<CategoryDto> {
    return this.request<CategoryDto>(`/api/Categories/slug/${encodeURIComponent(slug)}`);
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
          searchParams.append(key, normalizeQueryValue(key, value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<ProductListDtoPagedResultDto>(
      `/api/Products${query ? `?${query}` : ""}`
    );
  }

  /** Lấy toàn bộ sản phẩm bằng cách duyệt từng trang (mỗi trang tối đa 100). */
  async getAllProducts(
    params?: Omit<Parameters<ApiClient["getProducts"]>[0] & object, "Page" | "PageSize">,
    maxPages = 30
  ): Promise<ProductListDtoPagedResultDto> {
    const first = await this.getProducts({ ...params, Page: 1, PageSize: MAX_PAGE_SIZE });
    const items = [...(first.items ?? [])];
    const totalPages = Math.min(first.totalPages || 1, maxPages);
    for (let page = 2; page <= totalPages; page++) {
      const next = await this.getProducts({ ...params, Page: page, PageSize: MAX_PAGE_SIZE });
      items.push(...(next.items ?? []));
    }
    return { ...first, items, page: 1, pageSize: items.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false };
  }

  async getProductById(id: string): Promise<ProductDto> {
    return this.request<ProductDto>(`/api/Products/${encodeURIComponent(id)}`);
  }

  async getProductBySlug(slug: string): Promise<ProductDto> {
    // Backend now supports slug or id in a single endpoint
    return this.request<ProductDto>(`/api/Products/${encodeURIComponent(slug)}`);
  }

  async getProductComments(productId: string): Promise<ProductComment[]> {
    const res = await this.request<any>(`/api/Products/${encodeURIComponent(productId)}/comments`);
    if (Array.isArray(res)) return res as ProductComment[];
    if (res && Array.isArray(res.comments)) return res.comments as ProductComment[];
    return [];
  }

  async addProductComment(productId: string, content: string): Promise<void> {
    return this.request<void>(`/api/Products/${encodeURIComponent(productId)}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async replyProductComment(productId: string, parentCommentId: string, content: string): Promise<void> {
    return this.request<void>(`/api/Products/${encodeURIComponent(productId)}/comments/${encodeURIComponent(parentCommentId)}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  // Comment APIs by slug
  async getProductCommentsBySlug(slug: string): Promise<ProductComment[]> {
    const res = await this.request<any>(`/api/Products/slug/${encodeURIComponent(slug)}/comments`);
    if (Array.isArray(res)) return res as ProductComment[];
    if (res && Array.isArray(res.comments)) return res.comments as ProductComment[];
    return [];
  }

  async addProductCommentBySlug(slug: string, content: string): Promise<void> {
    return this.request<void>(`/api/Products/slug/${encodeURIComponent(slug)}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async replyProductCommentBySlug(slug: string, parentCommentId: string, content: string): Promise<void> {
    return this.request<void>(`/api/Products/slug/${encodeURIComponent(slug)}/comments/${encodeURIComponent(parentCommentId)}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async deleteProductCommentBySlug(slug: string, commentId: string): Promise<void> {
    return this.request<void>(`/api/Products/slug/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`, {
      method: "DELETE",
    });
  }

  // Product Reviews endpoints
  async getProductReviews(productIdOrSlug: string): Promise<ProductReviewResponse> {
    return this.request<ProductReviewResponse>(`/api/products/${encodeURIComponent(productIdOrSlug)}/reviews`);
  }

  async createProductReview(productIdOrSlug: string, data: CreateProductReviewRequest): Promise<ProductReview> {
    return this.request<ProductReview>(`/api/products/${encodeURIComponent(productIdOrSlug)}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
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
          searchParams.append(key, normalizeQueryValue(key, value));
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
    return this.request<CartItemDto>(`/api/Cart/items/${encodeURIComponent(cartItemId)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCartItem(cartItemId: string): Promise<void> {
    return this.request<void>(`/api/Cart/items/${encodeURIComponent(cartItemId)}`, {
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
    if (DEBUG_API) {
      console.log("API createOrder raw response:", response);
    }
    return response;
  }

  async getMyOrders(): Promise<OrderDto[]> {
    return this.request<OrderDto[]>("/api/Orders/my");
  }

  async getOrderById(id: string): Promise<OrderDto> {
    return this.request<OrderDto>(`/api/Orders/${encodeURIComponent(id)}`);
  }

  async createPayment(orderId: string): Promise<CreatePaymentResponse> {
    return this.request<CreatePaymentResponse>(`/api/Orders/${encodeURIComponent(orderId)}/payment`, {
      method: "POST",
    });
  }

  // Guest Orders endpoints
  async createGuestOrder(data: CreateGuestOrderRequest): Promise<OrderDto | CreateOrderResponse> {
    // Chỉ gửi {productId, productVariantId?, quantity} cho mỗi item — giá/tổng tiền do server tính.
    const response = await this.request<OrderDto | CreateOrderResponse>("/api/guest-orders", {
      method: "POST",
      body: JSON.stringify(sanitizeGuestOrderPayload(data)),
    });
    if (DEBUG_API) {
      console.log("API createGuestOrder raw response:", response);
    }
    return response;
  }

  /** Tra cứu đơn guest: BẮT BUỘC cả email và mã đơn. Backend trả mảng tối đa 1 đơn (hoặc 404). */
  async lookupGuestOrder(params: { email: string; orderNumber: string }): Promise<OrderDto[]> {
    const qs = new URLSearchParams({
      email: params.email.trim(),
      orderNumber: params.orderNumber.trim(),
    });
    const result = await this.request<OrderDto[] | OrderDto | null>(
      `/api/guest-orders/lookup?${qs.toString()}`
    );
    if (!result) return [];
    return Array.isArray(result) ? result : [result];
  }

  async getGuestOrder(id: string, email: string): Promise<OrderDto> {
    return this.request<OrderDto>(
      `/api/guest-orders/${encodeURIComponent(id)}?${new URLSearchParams({ email: email.trim() })}`
    );
  }

  async getGuestOrderByNumber(orderNumber: string, email: string): Promise<OrderDto> {
    return this.request<OrderDto>(
      `/api/guest-orders/status/${encodeURIComponent(orderNumber)}?${new URLSearchParams({ email: email.trim() })}`
    );
  }

  async createGuestPayment(orderId: string, email: string): Promise<CreatePaymentResponse> {
    return this.request<CreatePaymentResponse>(
      `/api/guest-orders/${encodeURIComponent(orderId)}/payment?${new URLSearchParams({ email: email.trim() })}`,
      { method: "POST" }
    );
  }

  /**
   * Xác nhận thanh toán PayOS phía server. KHÔNG tin `status`/`code` trên URL.
   * Tự gắn Authorization nếu đã đăng nhập (đơn của user chỉ chủ đơn mới xác nhận được).
   */
  async confirmPayosPayment(data: { orderCode: number; orderId?: string }): Promise<PayosConfirmResponse> {
    const body: { orderCode: number; orderId?: string } = { orderCode: data.orderCode };
    if (data.orderId) body.orderId = data.orderId;
    return this.request<PayosConfirmResponse>("/api/payments/payos/confirm", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // Admin endpoints
  // Trả về cây danh mục: category gốc + children giống swagger /api/admin/AdminCategories
  async adminGetCategories(): Promise<CategoryTreeDto[]> {
    return this.request<CategoryTreeDto[]>("/api/admin/AdminCategories");
  }

  async adminGetCategoryById(id: string): Promise<CategoryTreeDto> {
    return this.request<CategoryTreeDto>(`/api/admin/AdminCategories/${encodeURIComponent(id)}`);
  }

  async adminCreateCategory(data: AdminCreateCategoryRequest): Promise<ProductCategory> {
    const payload: AdminCreateCategoryRequest = {
      name: data.name.trim(),
      description: data.description?.trim() || "",
      children: data.children?.map((c) => ({
        name: c.name.trim(),
        description: c.description?.trim() || "",
      })),
    };

    return this.request<ProductCategory>("/api/admin/AdminCategories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async adminUpdateCategory(
    id: string,
    data: AdminUpdateCategoryRequest
  ): Promise<void> {
    const payload: AdminUpdateCategoryRequest = {
      name: data.name.trim(),
      description: data.description?.trim() || "",
      children: data.children?.map((c) => ({
        name: c.name.trim(),
        description: c.description?.trim() || "",
      })),
    };

    return this.request<void>(`/api/admin/AdminCategories/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async adminDeleteCategory(id: string): Promise<void> {
    return this.request<void>(`/api/admin/AdminCategories/${encodeURIComponent(id)}`, {
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
          searchParams.append(key, normalizeQueryValue(key, value));
        }
      });
    }
    const query = searchParams.toString();
    const endpoint = `/api/admin/AdminOrders${query ? `?${query}` : ""}`;
    
    try {
      const result = await this.request<Order[]>(endpoint);
      if (DEBUG_API) {
        console.log("[adminGetOrders] Success:", result);
      }
      return result;
    } catch (error) {
      if (DEBUG_API) {
        console.error("[adminGetOrders] Error:", error);
      }
      throw error;
    }
  }

  async adminGetOrderById(id: string): Promise<Order> {
    const endpoint = `/api/admin/AdminOrders/${encodeURIComponent(id)}`;
    
    try {
      // Backend may return OrderDto format (with shippingAddress) or Order format (with individual fields)
      // Accept any format and transform to Order
      const result = await this.request<any>(endpoint);

      if (DEBUG_API) {
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
        
        if (DEBUG_API) {
          console.log("[adminGetOrderById] Transformed to Order:", order);
        }
        
        return order;
      }
      
      // It's already Order format (has individual shipping fields)
      return result as Order;
    } catch (error) {
      if (DEBUG_API) {
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
    return this.request<void>(`/api/admin/AdminOrders/${encodeURIComponent(id)}/status`, {
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
      const result = await this.getAllProducts();
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
    return this.request<Product>(`/api/admin/AdminProducts/${encodeURIComponent(id)}`);
  }

  async adminCreateProduct(data: Product): Promise<Product> {
    if (DEBUG_API) {
      console.log("🔵 [adminCreateProduct] Input data:", JSON.stringify(data, null, 2));
    }

    // Validate categoryId - must not be empty
    const categoryIdValue = data.categoryId || "";
    if (!categoryIdValue || categoryIdValue.trim() === "") {
      if (DEBUG_API) {
        console.error("❌ [adminCreateProduct] categoryId is empty!");
      }
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
    if ((data as any).variants !== undefined && (data as any).variants !== null) {
      const variants = (data as any).variants;
      if (Array.isArray(variants) && variants.length > 0) {
        // Validate and format variants
        const formattedVariants = variants.map((v: any, index: number) => {
          // SKU no longer from form; use generated placeholder if backend requires it
          const sku = (v.sku?.trim() || "") || `VAR-${index + 1}`;
          return {
            color: v.color?.trim() || null,
            size: v.size?.trim() || null,
            spec: v.spec?.trim() || null,
            price: typeof v.price === "number" ? v.price : Number(v.price) || 0,
            originalPrice: v.originalPrice !== undefined && v.originalPrice !== null
              ? (typeof v.originalPrice === "number" ? v.originalPrice : Number(v.originalPrice))
              : null,
            stockQuantity: typeof v.stockQuantity === "number" ? v.stockQuantity : Number(v.stockQuantity) || 0,
            sku,
            isActive: Boolean(v.isActive),
          };
        });
        
        payload.variants = formattedVariants;
        if (DEBUG_API) {
          console.log("🔵 [adminCreateProduct] Formatted variants:", JSON.stringify(formattedVariants, null, 2));
        }
      } else if (variants === null || (Array.isArray(variants) && variants.length === 0)) {
        // Send null for empty array or explicitly null
        payload.variants = null;
      }
    }

    if (DEBUG_API) {
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
    }

    try {
      const result = await this.request<Product>("/api/admin/AdminProducts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (DEBUG_API) {
        console.log("✅ [adminCreateProduct] Success:", result);
      }
      return result;
    } catch (error: any) {
      if (DEBUG_API) {
        console.error("❌ [adminCreateProduct] Error:", error);
        console.error("❌ [adminCreateProduct] Error status:", error?.status);
        console.error("❌ [adminCreateProduct] Error data:", JSON.stringify(error?.data, null, 2));
      }
      throw error;
    }
  }

  async adminUpdateProduct(id: string, data: Product): Promise<void> {
    if (DEBUG_API) {
      console.log("🟡 [adminUpdateProduct] Product ID:", id);
      console.log("🟡 [adminUpdateProduct] Input data:", JSON.stringify(data, null, 2));
    }

    // Validate categoryId - must not be empty
    const categoryIdValue = data.categoryId || "";
    if (!categoryIdValue || categoryIdValue.trim() === "") {
      if (DEBUG_API) {
        console.error("❌ [adminUpdateProduct] categoryId is empty!");
      }
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
    // - If [...], add it = replace all variants (with generated sku if missing)
    if ((data as any).variants !== undefined) {
      const rawVariants = (data as any).variants;
      if (rawVariants === null || !Array.isArray(rawVariants)) {
        payload.variants = rawVariants;
      } else if (rawVariants.length === 0) {
        payload.variants = [];
      } else {
        payload.variants = rawVariants.map((v: any, index: number) => ({
          ...v,
          sku: (v.sku?.trim() || "") || `VAR-${index + 1}`,
        }));
      }
    }

    if (DEBUG_API) {
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
    }

    try {
      const result = await this.request<void>(`/api/admin/AdminProducts/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (DEBUG_API) {
        console.log("✅ [adminUpdateProduct] Success");
      }
      return result;
    } catch (error: any) {
      if (DEBUG_API) {
        console.error("❌ [adminUpdateProduct] Error:", error);
        console.error("❌ [adminUpdateProduct] Error status:", error?.status);
        console.error("❌ [adminUpdateProduct] Error data:", JSON.stringify(error?.data, null, 2));
      }
      throw error;
    }
  }

  async adminDeleteProduct(id: string): Promise<void> {
    return this.request<void>(`/api/admin/AdminProducts/${encodeURIComponent(id)}`, {
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
    return this.request<User>(`/api/Users/${encodeURIComponent(id)}`);
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>("/api/Users");
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<void> {
    if (DEBUG_API) {
      console.log("[ApiClient] updateUser called:", {
        id,
        data,
        stringified: JSON.stringify(data),
      });
    }
    return this.request<void>(`/api/Users/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/api/Users/${encodeURIComponent(id)}`, {
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
    return this.request<void>(`/api/admin/AdminUsers/${encodeURIComponent(id)}/status`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  // Wishlist endpoints
  async getWishlist(): Promise<WishlistItem[]> {
    return this.request<WishlistItem[]>("/api/Wishlist");
  }

  async addToWishlist(productId: string): Promise<void> {
    return this.request<void>(`/api/Wishlist/${encodeURIComponent(productId)}`, {
      method: "POST",
    });
  }

  async removeFromWishlist(productId: string): Promise<void> {
    return this.request<void>(`/api/Wishlist/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });
  }

  // Chat endpoints
  async sendChatMessage(data: ChatMessageRequest): Promise<ChatMessageResponse> {
    return this.request<ChatMessageResponse>("/api/Chat/message", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // News endpoints (Public)
  async getNews(params?: {
    Page?: number;
    PageSize?: number;
    Category?: string;
    SearchTerm?: string;
    SortBy?: string;
  }): Promise<PagedNewsResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, normalizeQueryValue(key, value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PagedNewsResponse>(
      `/api/news${query ? `?${query}` : ""}`
    );
  }

  async getNewsDetail(idOrSlug: string): Promise<NewsDto> {
    return this.request<NewsDto>(`/api/news/${encodeURIComponent(idOrSlug)}`);
  }

  async getNewsCategories(): Promise<string[]> {
    return this.request<string[]>("/api/news/categories");
  }

  // Admin News endpoints
  async adminGetAllNews(params?: {
    Page?: number;
    PageSize?: number;
    Category?: string;
    SearchTerm?: string;
    SortBy?: string;
    IsPublished?: boolean | null;
  }): Promise<PagedNewsResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, normalizeQueryValue(key, value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PagedNewsResponse>(
      `/api/admin/adminnews${query ? `?${query}` : ""}`
    );
  }

  async adminCreateNews(data: CreateNewsRequest): Promise<NewsDto> {
    return this.request<NewsDto>("/api/admin/adminnews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async adminUpdateNews(id: string, data: UpdateNewsRequest): Promise<NewsDto> {
    return this.request<NewsDto>(`/api/admin/adminnews/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async adminDeleteNews(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/admin/adminnews/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // ===== Vouchers (Admin) =====

  async adminGetVouchers(params?: {
    Page?: number;
    PageSize?: number;
    SearchTerm?: string;
    IsPublic?: boolean | null;
  }): Promise<PagedVoucherResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, normalizeQueryValue(key, value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PagedVoucherResponse>(
      `/api/admin/vouchers${query ? `?${query}` : ""}`
    );
  }

  async adminGetVoucherById(id: string): Promise<Voucher> {
    return this.request<Voucher>(`/api/admin/vouchers/${encodeURIComponent(id)}`);
  }

  async adminCreateVoucher(data: CreateVoucherRequest): Promise<Voucher> {
    return this.request<Voucher>("/api/admin/vouchers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async adminUpdateVoucher(
    id: string,
    data: UpdateVoucherRequest
  ): Promise<Voucher> {
    return this.request<Voucher>(`/api/admin/vouchers/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async adminDeleteVoucher(id: string): Promise<void> {
    return this.request<void>(`/api/admin/vouchers/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  async adminPublishVoucher(id: string, isPublic: boolean): Promise<void> {
    const url = `/api/admin/vouchers/${encodeURIComponent(id)}/publish?isPublic=${isPublic}`;
    return this.request<void>(url, {
      method: "PATCH",
    });
  }

  // ===== Vouchers (Customer / Guest) =====

  async applyVoucherForUser(
    data: ApplyVoucherRequest
  ): Promise<ApplyVoucherResponse> {
    // Server tự tính giá trên giỏ hàng: chỉ gửi mã.
    return this.request<ApplyVoucherResponse>("/api/Orders/apply-voucher", {
      method: "POST",
      body: JSON.stringify({ code: data.code }),
    });
  }

  async applyVoucherForGuest(
    data: GuestApplyVoucherRequest
  ): Promise<GuestApplyVoucherResponse> {
    return this.request<GuestApplyVoucherResponse>(
      "/api/guest-orders/apply-voucher",
      {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          code: data.code,
          items: sanitizeOrderItems(data.items),
        }),
      }
    );
  }

  // ===== Product Specifications (Admin) =====

  async adminGetProductSpecifications(productId: string): Promise<ProductSpecification[]> {
    return this.request<ProductSpecification[]>(
      `/api/admin/products/${encodeURIComponent(productId)}/specifications`
    );
  }

  async adminCreateProductSpecification(
    productId: string,
    data: CreateProductSpecificationRequest
  ): Promise<ProductSpecification> {
    return this.request<ProductSpecification>(
      `/api/admin/products/${encodeURIComponent(productId)}/specifications`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async adminUpdateProductSpecification(
    productId: string,
    specificationId: string,
    data: UpdateProductSpecificationRequest
  ): Promise<ProductSpecification> {
    return this.request<ProductSpecification>(
      `/api/admin/products/${encodeURIComponent(productId)}/specifications/${encodeURIComponent(specificationId)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  async adminDeleteProductSpecification(
    productId: string,
    specificationId: string
  ): Promise<void> {
    return this.request<void>(
      `/api/admin/products/${encodeURIComponent(productId)}/specifications/${encodeURIComponent(specificationId)}`,
      {
        method: "DELETE",
      }
    );
  }

  async adminBulkUpdateProductSpecifications(
    productId: string,
    data: BulkUpdateProductSpecificationsRequest
  ): Promise<ProductSpecification[]> {
    return this.request<ProductSpecification[]>(
      `/api/admin/products/${encodeURIComponent(productId)}/specifications/bulk`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }
}

export const apiClient = new ApiClient(API_BASE_URL);


