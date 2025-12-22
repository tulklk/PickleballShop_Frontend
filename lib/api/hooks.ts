import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { useAuth } from "@/lib/auth/useAuth";
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  AddCartItemRequest,
  UpdateCartItemRequest,
  CreateOrderRequest,
  CreateGuestOrderRequest,
  ProductCategory,
  Product,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationEmailRequest,
  ForgotPasswordRequest,
  UpdateOrderStatusRequest,
  OrderStatus,
  PaymentStatus,
  UserDto,
  User,
  UpdateUserRequest,
  WishlistItem,
  ChatMessageRequest,
  ProductComment,
  ProductReviewResponse,
  CreateProductReviewRequest,
  NewsListDto,
  NewsDto,
  PagedNewsResponse,
  CreateNewsRequest,
  UpdateNewsRequest,
  AdminCreateCategoryRequest,
  AdminUpdateCategoryRequest,
  // Voucher types
  PagedVoucherResponse,
  Voucher,
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

// Helper to sync guest cart to server
async function syncGuestCart() {
  if (typeof window === "undefined") return;
  try {
    const { getGuestCart, clearGuestCart } = await import("@/lib/utils/guestCart");
    const guestCart = getGuestCart();
    if (guestCart.length === 0) return;

    // Wait a bit to ensure token is set
    await new Promise(resolve => setTimeout(resolve, 100));

    const failedItems: typeof guestCart = [];
    
    // Add each item from guest cart to server cart
    for (const item of guestCart) {
      try {
        // Only send productId and quantity to API
        await apiClient.addCartItem({
          productId: item.productId,
          quantity: item.quantity,
        });
      } catch (error) {
        console.warn("Failed to sync cart item:", error);
        // Keep failed items to retry later
        failedItems.push(item);
      }
    }

    // Only clear guest cart if ALL items were synced successfully
    if (failedItems.length === 0) {
      clearGuestCart();
    } else {
      // Save failed items back to guest cart for retry
      localStorage.setItem("guestCart", JSON.stringify(failedItems));
      console.warn(`Failed to sync ${failedItems.length} items. They will be kept in guest cart.`);
    }
  } catch (error) {
    console.warn("Failed to sync guest cart:", error);
    // Don't clear guest cart on error
  }
}

// Auth hooks
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data),
    onSuccess: async (data) => {
      // Save tokens to localStorage
      if (data.accessToken) {
        apiClient.setAccessToken(data.accessToken);
      }
      if (data.refreshToken) {
        apiClient.setRefreshToken(data.refreshToken);
      }
      // Save user info to React Query cache
      queryClient.setQueryData(["user"], data.user);
      // Invalidate and refetch user/me to get full user data with avatarUrl
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      // Sync guest cart to server after login
      await syncGuestCart();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.register(data),
    onSuccess: async (data) => {
      // Save tokens to localStorage
      if (data.accessToken) {
        apiClient.setAccessToken(data.accessToken);
      }
      if (data.refreshToken) {
        apiClient.setRefreshToken(data.refreshToken);
      }
      // Save user info to React Query cache
      queryClient.setQueryData(["user"], data.user);
      // Sync guest cart to server after register
      await syncGuestCart();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useRefreshToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RefreshTokenRequest) => apiClient.refreshToken(data),
    onSuccess: (data) => {
      // Save new tokens to localStorage
      if (data.accessToken) {
        apiClient.setAccessToken(data.accessToken);
      }
      if (data.refreshToken) {
        apiClient.setRefreshToken(data.refreshToken);
      }
      // Update user info if provided
      if (data.user) {
        queryClient.setQueryData(["user"], data.user);
      }
    },
  });
}

export function useGoogleAuthLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idToken: string) => apiClient.loginWithGoogle(idToken),
    onSuccess: async (data) => {
      // Save tokens to localStorage
      if (data.accessToken) {
        apiClient.setAccessToken(data.accessToken);
      }
      if (data.refreshToken) {
        apiClient.setRefreshToken(data.refreshToken);
      }
      // Save user info to React Query cache
      queryClient.setQueryData(["user"], data.user);
      // Invalidate user/me to refetch full user data
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      // Sync guest cart to server after Google login
      await syncGuestCart();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      // Delay slightly to ensure user state is updated before refetching wishlist
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      }, 200);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RefreshTokenRequest) => apiClient.logout(data),
    onSuccess: () => {
      // Clear all tokens from localStorage
      apiClient.setAccessToken(null);
      apiClient.setRefreshToken(null);
      // Clear React Query cache
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => apiClient.changePassword(data),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => apiClient.verifyEmail(data),
  });
}

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: (data: ResendVerificationEmailRequest) => apiClient.resendVerificationEmail(data),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => apiClient.forgotPassword(data),
  });
}

// Categories hooks
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes - Categories ít thay đổi
    gcTime: 60 * 60 * 1000, // 60 minutes - Giữ cache lâu hơn
    retry: 1,
    retryOnMount: false,
  });
}

// Categories tree for navigation dropdowns
export function useCategoryTree() {
  return useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => apiClient.getCategoryTree(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => apiClient.getCategoryById(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ["category", "slug", slug],
    queryFn: () => apiClient.getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  });
}

// Products hooks
export function useProducts(params?: {
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
}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => apiClient.getProducts(params),
    staleTime: 15 * 60 * 1000, // 15 minutes - Products thay đổi không thường xuyên
    gcTime: 45 * 60 * 1000, // 45 minutes - Giữ cache để navigate qua lại nhanh
    retry: 1,
    retryOnMount: false,
    placeholderData: (previousData) => previousData, // Giữ data cũ khi loading data mới (UX mượt mà)
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => apiClient.getProductById(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", "slug", slug],
    queryFn: () => apiClient.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
  });
}

// Product comments
export function useProductComments(productId: string) {
  return useQuery({
    queryKey: ["product", "comments", productId],
    queryFn: () => apiClient.getProductComments(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes - Comments có thể thay đổi thường xuyên hơn
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useAddProductComment(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => apiClient.addProductComment(productId, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["product", "comments", productId] });
      await queryClient.refetchQueries({ queryKey: ["product", "comments", productId] });
    },
  });
}

export function useReplyProductComment(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentCommentId, content }: { parentCommentId: string; content: string }) =>
      apiClient.replyProductComment(productId, parentCommentId, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["product", "comments", productId] });
      await queryClient.refetchQueries({ queryKey: ["product", "comments", productId] });
    },
  });
}

// Product comments by slug
// Product Reviews hooks
export function useProductReviews(productIdOrSlug: string) {
  return useQuery({
    queryKey: ["product", "reviews", productIdOrSlug],
    queryFn: () => apiClient.getProductReviews(productIdOrSlug),
    enabled: !!productIdOrSlug,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateProductReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productIdOrSlug,
      data,
    }: {
      productIdOrSlug: string;
      data: CreateProductReviewRequest;
    }) => apiClient.createProductReview(productIdOrSlug, data),
    onSuccess: (_, variables) => {
      // Invalidate reviews query to refetch
      queryClient.invalidateQueries({ queryKey: ["product", "reviews", variables.productIdOrSlug] });
      // Also invalidate product queries (both by id and by slug) to update averageRating and reviewCount
      queryClient.invalidateQueries({ queryKey: ["product", variables.productIdOrSlug] });
      queryClient.invalidateQueries({ queryKey: ["product", "slug", variables.productIdOrSlug] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useProductCommentsBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", "comments", "slug", slug],
    queryFn: () => apiClient.getProductCommentsBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useAddProductCommentBySlug(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => apiClient.addProductCommentBySlug(slug, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["product", "comments", "slug", slug] });
      await queryClient.refetchQueries({ queryKey: ["product", "comments", "slug", slug] });
    },
  });
}

export function useReplyProductCommentBySlug(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentCommentId, content }: { parentCommentId: string; content: string }) =>
      apiClient.replyProductCommentBySlug(slug, parentCommentId, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["product", "comments", "slug", slug] });
      await queryClient.refetchQueries({ queryKey: ["product", "comments", "slug", slug] });
    },
  });
}

export function useDeleteProductCommentBySlug(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => apiClient.deleteProductCommentBySlug(slug, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", "comments", "slug", slug] });
    },
  });
}

export function useFeaturedProducts(count?: number) {
  return useQuery({
    queryKey: ["products", "featured", count],
    queryFn: () => apiClient.getFeaturedProducts(count),
    staleTime: 20 * 60 * 1000, // 20 minutes - Featured products ít thay đổi
    gcTime: 60 * 60 * 1000, // 60 minutes
    retry: 1,
    retryOnMount: false,
  });
}

export function useSearchProducts(params?: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["products", "search", params],
    queryFn: () => apiClient.searchProducts(params),
    enabled: !!params?.q,
    staleTime: 10 * 60 * 1000, // 10 minutes - Search results
    gcTime: 30 * 60 * 1000, // 30 minutes
    placeholderData: (previousData) => previousData, // Giữ kết quả search cũ khi loading
  });
}

// Cart hooks
export function useCart() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ["cart", isAuthenticated], // Include isAuthenticated in query key to refetch when auth state changes
    queryFn: async () => {
      if (isAuthenticated) {
        try {
          const cart = await apiClient.getCart();
          // Debug logging in development
          if (process.env.NODE_ENV === "development") {
            console.log("[useCart] Fetched cart from API:", cart);
          }
          return cart;
        } catch (error) {
          // If API fails, fallback to guest cart
          console.warn("Failed to get cart from API, using guest cart:", error);
          const { getGuestCart } = await import("@/lib/utils/guestCart");
          const guestCart = getGuestCart();
          const items = guestCart.map((item, index) => ({
            id: `guest-${index}`,
            productId: item.productId,
            productVariantId: item.productVariantId || null,
            productName: item.productName || null,
            productImageUrl: item.productImageUrl || null,
            variantInfo: item.variantInfo || null,
            unitPrice: item.unitPrice || 0,
            quantity: item.quantity,
            lineTotal: (item.unitPrice || 0) * item.quantity,
          }));
          return {
            items,
            totalItems: guestCart.reduce((sum, item) => sum + item.quantity, 0),
            subTotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
            totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
          };
        }
      } else {
        // Return guest cart from localStorage
        const { getGuestCart } = await import("@/lib/utils/guestCart");
        const guestCart = getGuestCart();
        // Transform to CartDto format
        const items = guestCart.map((item, index) => ({
          id: `guest-${index}`,
          productId: item.productId,
          productVariantId: item.productVariantId || null,
          productName: item.productName || null,
          productImageUrl: item.productImageUrl || null,
          variantInfo: item.variantInfo || null,
          unitPrice: item.unitPrice || 0,
          quantity: item.quantity,
          lineTotal: (item.unitPrice || 0) * item.quantity,
        }));
        return {
          items,
          totalItems: guestCart.reduce((sum, item) => sum + item.quantity, 0),
          subTotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
          totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
        };
      }
    },
    enabled: true, // Always enabled to show guest cart
    refetchOnMount: true, // Refetch when component mounts
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  return useMutation({
    mutationFn: async (data: AddCartItemRequest) => {
      const result = await apiClient.addCartItem(data);
      // Debug logging in development
      if (process.env.NODE_ENV === "development") {
        console.log("[useAddCartItem] Added item to cart:", result);
      }
      return result;
    },
    onSuccess: async () => {
      // Small delay to ensure backend has processed the request
      await new Promise(resolve => setTimeout(resolve, 200));
      // Invalidate all cart queries (both authenticated and guest)
      await queryClient.invalidateQueries({ 
        queryKey: ["cart"],
        refetchType: "active" // Only refetch active queries
      });
      // Also explicitly refetch the current cart query to ensure it updates
      await queryClient.refetchQueries({ 
        queryKey: ["cart", isAuthenticated],
        type: "active"
      });
      // Debug logging in development
      if (process.env.NODE_ENV === "development") {
        console.log("[useAddCartItem] Invalidated and refetched cart queries");
      }
    },
    onError: (error: any) => {
      // Log error for debugging
      if (process.env.NODE_ENV === "development") {
        console.warn("[Add Cart Item Error]", {
          status: error?.status,
          message: error?.message,
          data: error?.data,
        });
      }
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cartItemId,
      data,
    }: {
      cartItemId: string;
      data: UpdateCartItemRequest;
    }) => apiClient.updateCartItem(cartItemId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: ["cart"],
        refetchType: "active"
      });
    },
  });
}

export function useDeleteCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartItemId: string) => apiClient.deleteCartItem(cartItemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: ["cart"],
        refetchType: "active"
      });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.clearCart(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: ["cart"],
        refetchType: "active"
      });
    },
  });
}

// Orders hooks
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => apiClient.createOrder(data),
    onSuccess: () => {
      // Invalidate orders and cart, but preserve session
      queryClient.invalidateQueries({ 
        queryKey: ["orders"],
        exact: false // Invalidate all order-related queries
      });
      queryClient.invalidateQueries({ 
        queryKey: ["cart"],
        exact: false // Invalidate all cart-related queries
      });
      // Explicitly preserve user session data
      const currentUser = queryClient.getQueryData<UserDto>(["user"]);
      if (currentUser) {
        queryClient.setQueryData(["user"], currentUser);
      }
    },
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ["orders", "my"],
    queryFn: () => apiClient.getMyOrders(),
    staleTime: 2 * 60 * 1000, // 2 minutes - Orders có thể thay đổi (payment status, order status)
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => apiClient.getOrderById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: (orderId: string) => apiClient.createPayment(orderId),
  });
}

// Guest Orders hooks
export function useCreateGuestOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGuestOrderRequest) => apiClient.createGuestOrder(data),
    onSuccess: () => {
      // Invalidate orders queries
      queryClient.invalidateQueries({ 
        queryKey: ["orders"],
        exact: false
      });
      // Clear guest cart after successful order
      if (typeof window !== "undefined") {
        const { clearGuestCart } = require("@/lib/utils/guestCart");
        clearGuestCart();
      }
    },
  });
}

export function useGuestOrder(id: string) {
  return useQuery({
    queryKey: ["guestOrder", id],
    queryFn: () => apiClient.getGuestOrder(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useLookupGuestOrder() {
  return useMutation({
    mutationFn: (params: { phoneNumber: string; orderNumber?: string }) => 
      apiClient.lookupGuestOrder(params),
  });
}

export function useCreateGuestPayment() {
  return useMutation({
    mutationFn: (orderId: string) => apiClient.createGuestPayment(orderId),
  });
}

// Admin hooks
export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiClient.adminGetCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useAdminCategory(id: string) {
  return useQuery({
    queryKey: ["admin", "category", id],
    queryFn: () => apiClient.adminGetCategoryById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useAdminCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminCreateCategoryRequest) =>
      apiClient.adminCreateCategory(data),
    onSuccess: async () => {
      // Invalidate and refetch immediately
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      await queryClient.refetchQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

export function useAdminUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: AdminUpdateCategoryRequest;
    }) => apiClient.adminUpdateCategory(id, data),
    onSuccess: async () => {
      // Invalidate and refetch immediately
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "category"] });
      await queryClient.refetchQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

export function useAdminDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.adminDeleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useAdminOrders(params?: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["admin", "orders", params],
    queryFn: () => apiClient.adminGetOrders(params),
    staleTime: 1 * 60 * 1000, // 1 minute - Admin orders cần update thường xuyên
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => apiClient.adminGetOrderById(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAdminUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateOrderStatusRequest;
    }) => apiClient.adminUpdateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}


export function useAdminProducts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => apiClient.adminGetProducts(),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => apiClient.adminGetProductById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useAdminCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Product) => apiClient.adminCreateProduct(data),
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ 
        queryKey: ["admin", "products"],
        refetchType: "active"
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["products"],
        refetchType: "active"
      });
      // Explicitly refetch to ensure data is updated
      await queryClient.refetchQueries({ queryKey: ["admin", "products"] });
      await queryClient.refetchQueries({ queryKey: ["products"] });
    },
  });
}

export function useAdminUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Product }) =>
      apiClient.adminUpdateProduct(id, data),
    onSuccess: async (_, variables) => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ 
        queryKey: ["admin", "products"],
        refetchType: "active"
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["products"],
        refetchType: "active"
      });
      // Also invalidate the specific product
      await queryClient.invalidateQueries({ 
        queryKey: ["admin", "product", variables.id]
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["product", variables.id]
      });
      // Explicitly refetch to ensure data is updated
      await queryClient.refetchQueries({ queryKey: ["admin", "products"] });
      await queryClient.refetchQueries({ queryKey: ["products"] });
    },
  });
}

export function useAdminDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.adminDeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// User hooks
export function useUserMe() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: () => apiClient.getUserMe(),
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 0, // Always consider stale to refetch when needed
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => apiClient.getUser(id),
    enabled: !!id,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    // Use admin endpoint for user management in admin panel
    queryFn: () => apiClient.adminGetUsers(),
  });
}

// Wishlist hooks
export function useWishlist() {
  const { isAuthenticated, user } = useAuth();
  
  return useQuery({
    queryKey: ["wishlist", isAuthenticated, user?.id], // Include user ID to refetch when user changes
    queryFn: async () => {
      if (!isAuthenticated) {
        return [] as WishlistItem[];
      }
      
      try {
        const result: any = await apiClient.getWishlist();
        // Normalize to array in case backend returns paged result or wrapped object
        if (Array.isArray(result)) {
          return result as WishlistItem[];
        }
        if (result && Array.isArray(result.items)) {
          return result.items as WishlistItem[];
        }
        return [] as WishlistItem[];
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
        return [] as WishlistItem[];
      }
    },
    enabled: isAuthenticated && !!user?.id, // Only fetch when authenticated and user ID is available
    staleTime: 0, // Always consider stale to refetch when needed
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    initialData: [] as WishlistItem[],
  });
}

export function useToggleWishlist(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isInWishlist: boolean) => {
      if (!productId) return;
      if (isInWishlist) {
        await apiClient.removeFromWishlist(productId);
      } else {
        await apiClient.addToWishlist(productId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      apiClient.updateUser(id, data),
    onSuccess: async (_, variables) => {
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      
      // Refetch current user data and update cache
      try {
        const updatedUser = await apiClient.getUserMe();
        // Convert User to UserDto format for cache compatibility
        let roleString: string | null = null;
        if (updatedUser.role === 1) {
          roleString = "Customer";
        } else if (updatedUser.role === 2) {
          roleString = "Admin";
        } else if (updatedUser.role !== null && updatedUser.role !== undefined) {
          roleString = String(updatedUser.role);
        }
        
        const userDto: UserDto = {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          phoneNumber: updatedUser.phoneNumber,
          role: roleString,
          avatarUrl: updatedUser.avatarUrl || (updatedUser as any).avatar || null,
        };
        // Update the main user cache that useAuth() reads from
        queryClient.setQueryData(["user"], userDto);
        // Also update the user/me cache
        queryClient.setQueryData(["user", "me"], updatedUser);
      } catch (error) {
        console.warn("Failed to refetch user after update:", error);
        // Even if refetch fails, still invalidate to force refetch on next access
      }
    },
  });
}

// Admin: update only user status (isActive) via dedicated endpoint
export function useAdminUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.adminUpdateUserStatus(id, isActive),
    onSuccess: () => {
      // Refresh user list after status change
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// Session management hook
export function useSession() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      // Check if we have tokens in localStorage
      const accessToken = apiClient.getAccessToken();
      const refreshToken = apiClient.getRefreshToken();

      // If we have accessToken, try to get current user
      if (accessToken) {
        try {
          const user = await apiClient.getCurrentUser();
          queryClient.setQueryData(["user"], user);
          return { user, isAuthenticated: true };
        } catch (error: any) {
          // If accessToken is invalid/expired, try to refresh
          if (error?.status === 401 && refreshToken) {
            try {
              const refreshResponse = await apiClient.refreshToken({
                refreshToken,
              });
              // Save new tokens
              if (refreshResponse.accessToken) {
                apiClient.setAccessToken(refreshResponse.accessToken);
              }
              if (refreshResponse.refreshToken) {
                apiClient.setRefreshToken(refreshResponse.refreshToken);
              }
              if (refreshResponse.user) {
                queryClient.setQueryData(["user"], refreshResponse.user);
                return { user: refreshResponse.user, isAuthenticated: true };
              }
            } catch (refreshError) {
              // Refresh failed, clear session
              apiClient.setAccessToken(null);
              apiClient.setRefreshToken(null);
              queryClient.setQueryData(["user"], null);
              return { user: null, isAuthenticated: false };
            }
          }
          // If error is not 401, don't clear session - might be network issue
          // Only clear if it's definitely an auth error
          if (error?.status === 401) {
            apiClient.setAccessToken(null);
            apiClient.setRefreshToken(null);
            queryClient.setQueryData(["user"], null);
            return { user: null, isAuthenticated: false };
          }
          // For other errors, return existing user data if available
          const existingUser = queryClient.getQueryData<UserDto>(["user"]);
          if (existingUser) {
            return { user: existingUser, isAuthenticated: true };
          }
          return { user: null, isAuthenticated: false };
        }
      }

      // If we have refreshToken but no accessToken, try to refresh
      if (refreshToken && !accessToken) {
        try {
          const refreshResponse = await apiClient.refreshToken({
            refreshToken,
          });
          // Save new tokens
          if (refreshResponse.accessToken) {
            apiClient.setAccessToken(refreshResponse.accessToken);
          }
          if (refreshResponse.refreshToken) {
            apiClient.setRefreshToken(refreshResponse.refreshToken);
          }
          if (refreshResponse.user) {
            queryClient.setQueryData(["user"], refreshResponse.user);
            return { user: refreshResponse.user, isAuthenticated: true };
          }
        } catch (refreshError) {
          // Refresh failed, clear session
          apiClient.setRefreshToken(null);
          queryClient.setQueryData(["user"], null);
          return { user: null, isAuthenticated: false };
        }
      }

      // No tokens, not authenticated
      queryClient.setQueryData(["user"], null);
      return { user: null, isAuthenticated: false };
    },
    enabled: typeof window !== "undefined", // Only run on client
    retry: false, // Don't retry on failure
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}

// Chat hooks
export function useChatMessage() {
  return useMutation({
    mutationFn: (data: ChatMessageRequest) => apiClient.sendChatMessage(data),
  });
}

// News hooks (Public)
export function useNews(params?: {
  Page?: number;
  PageSize?: number;
  Category?: string;
  SearchTerm?: string;
  SortBy?: string;
}) {
  return useQuery({
    queryKey: ["news", params],
    queryFn: () => apiClient.getNews(params),
    staleTime: 15 * 60 * 1000, // 15 minutes - News ít thay đổi, cache lâu hơn
    gcTime: 60 * 60 * 1000, // 60 minutes - Giữ cache 1 giờ để navigate mượt mà
    refetchOnMount: false, // Không refetch khi mount lại nếu data còn fresh
    refetchOnWindowFocus: false, // Không refetch khi focus window
    placeholderData: (previousData) => previousData, // Giữ data cũ khi loading data mới (UX mượt mà)
    retry: 1,
    retryOnMount: false,
  });
}

export function useNewsDetail(idOrSlug: string) {
  return useQuery({
    queryKey: ["news", "detail", idOrSlug],
    queryFn: () => apiClient.getNewsDetail(idOrSlug),
    enabled: !!idOrSlug,
    staleTime: 15 * 60 * 1000, // 15 minutes - News detail ít thay đổi
    gcTime: 60 * 60 * 1000, // 60 minutes - Giữ cache 1 giờ
    refetchOnMount: false, // Không refetch khi mount lại
    refetchOnWindowFocus: false, // Không refetch khi focus window
    placeholderData: (previousData) => previousData, // Giữ data cũ khi loading
    retry: 1,
  });
}

export function useNewsCategories() {
  return useQuery({
    queryKey: ["news", "categories"],
    queryFn: () => apiClient.getNewsCategories(),
    staleTime: 60 * 60 * 1000, // 60 minutes - Categories rất ít thay đổi
    gcTime: 120 * 60 * 1000, // 120 minutes - Giữ cache 2 giờ
    refetchOnMount: false, // Không refetch khi mount lại
    refetchOnWindowFocus: false, // Không refetch khi focus window
    retry: 1,
    retryOnMount: false,
  });
}

// Admin News hooks
export function useAdminAllNews(params?: {
  Page?: number;
  PageSize?: number;
  Category?: string;
  SearchTerm?: string;
  SortBy?: string;
  IsPublished?: boolean | null;
}) {
  return useQuery({
    queryKey: ["admin", "news", params],
    queryFn: () => apiClient.adminGetAllNews(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAdminCreateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNewsRequest) => apiClient.adminCreateNews(data),
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ["admin", "news"] });
      await queryClient.invalidateQueries({ queryKey: ["news"] });
      // Refetch all admin news queries
      await queryClient.refetchQueries({ queryKey: ["admin", "news"] });
    },
  });
}

export function useAdminUpdateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNewsRequest }) =>
      apiClient.adminUpdateNews(id, data),
    onSuccess: async (_, variables) => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ["admin", "news"] });
      await queryClient.invalidateQueries({ queryKey: ["news"] });
      await queryClient.invalidateQueries({ queryKey: ["news", "detail", variables.id] });
      // Refetch all admin news queries
      await queryClient.refetchQueries({ queryKey: ["admin", "news"] });
    },
  });
}

export function useAdminDeleteNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.adminDeleteNews(id),
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ["admin", "news"] });
      await queryClient.invalidateQueries({ queryKey: ["news"] });
      // Refetch all admin news queries
      await queryClient.refetchQueries({ queryKey: ["admin", "news"] });
    },
  });
}

// ===== Voucher hooks (Admin) =====

export function useAdminVouchers(params?: {
  Page?: number;
  PageSize?: number;
  SearchTerm?: string;
  IsPublic?: boolean | null;
}) {
  return useQuery<PagedVoucherResponse>({
    queryKey: ["admin", "vouchers", params],
    queryFn: () => apiClient.adminGetVouchers(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAdminVoucher(id: string) {
  return useQuery<Voucher>({
    queryKey: ["admin", "voucher", id],
    queryFn: () => apiClient.adminGetVoucherById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAdminCreateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVoucherRequest) =>
      apiClient.adminCreateVoucher(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "vouchers"] });
      await queryClient.refetchQueries({ queryKey: ["admin", "vouchers"] });
    },
  });
}

export function useAdminUpdateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateVoucherRequest;
    }) => apiClient.adminUpdateVoucher(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "vouchers"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "voucher", variables.id],
      });
      await queryClient.refetchQueries({ queryKey: ["admin", "vouchers"] });
    },
  });
}

export function useAdminDeleteVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.adminDeleteVoucher(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "vouchers"] });
      await queryClient.refetchQueries({ queryKey: ["admin", "vouchers"] });
    },
  });
}

export function useAdminPublishVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      apiClient.adminPublishVoucher(id, isPublic),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "vouchers"] });
      await queryClient.refetchQueries({ queryKey: ["admin", "vouchers"] });
    },
  });
}

// ===== Voucher hooks (Customer / Guest) =====

export function useApplyVoucherForUser() {
  return useMutation<ApplyVoucherResponse, unknown, ApplyVoucherRequest>({
    mutationFn: (data: ApplyVoucherRequest) =>
      apiClient.applyVoucherForUser(data),
  });
}

export function useApplyVoucherForGuest() {
  return useMutation<
    GuestApplyVoucherResponse,
    unknown,
    GuestApplyVoucherRequest
  >({
    mutationFn: (data: GuestApplyVoucherRequest) =>
      apiClient.applyVoucherForGuest(data),
  });
}

// ===== Product Specifications hooks (Admin) =====

export function useAdminProductSpecifications(productId: string) {
  return useQuery<ProductSpecification[]>({
    queryKey: ["admin", "product", productId, "specifications"],
    queryFn: () => apiClient.adminGetProductSpecifications(productId),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAdminCreateProductSpecification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: CreateProductSpecificationRequest;
    }) => apiClient.adminCreateProductSpecification(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "product", variables.productId, "specifications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["product", variables.productId],
      });
    },
  });
}

export function useAdminUpdateProductSpecification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      specificationId,
      data,
    }: {
      productId: string;
      specificationId: string;
      data: UpdateProductSpecificationRequest;
    }) =>
      apiClient.adminUpdateProductSpecification(productId, specificationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "product", variables.productId, "specifications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["product", variables.productId],
      });
    },
  });
}

export function useAdminDeleteProductSpecification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      specificationId,
    }: {
      productId: string;
      specificationId: string;
    }) => apiClient.adminDeleteProductSpecification(productId, specificationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "product", variables.productId, "specifications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["product", variables.productId],
      });
    },
  });
}

export function useAdminBulkUpdateProductSpecifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: BulkUpdateProductSpecificationsRequest;
    }) => apiClient.adminBulkUpdateProductSpecifications(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "product", variables.productId, "specifications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["product", variables.productId],
      });
    },
  });
}

