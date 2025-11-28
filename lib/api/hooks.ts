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
  ProductCategory,
  Product,
  ChangePasswordRequest,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
  OrderStatus,
  PaymentStatus,
  UserDto,
  User,
  UpdateUserRequest,
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
      // Sync guest cart to server after Google login
      await syncGuestCart();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
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

// Categories hooks
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.getCategories(),
    retry: 1,
    retryOnMount: false,
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => apiClient.getCategoryById(id),
    enabled: !!id,
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ["category", "slug", slug],
    queryFn: () => apiClient.getCategoryBySlug(slug),
    enabled: !!slug,
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
    retry: 1,
    retryOnMount: false,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => apiClient.getProductById(id),
    enabled: !!id,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", "slug", slug],
    queryFn: () => apiClient.getProductBySlug(slug),
    enabled: !!slug,
  });
}

export function useFeaturedProducts(count?: number) {
  return useQuery({
    queryKey: ["products", "featured", count],
    queryFn: () => apiClient.getFeaturedProducts(count),
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
            productName: item.productName || null,
            productImageUrl: item.productImageUrl || null,
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
          productName: item.productName || null,
          productImageUrl: item.productImageUrl || null,
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
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => apiClient.getOrderById(id),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: (orderId: string) => apiClient.createPayment(orderId),
  });
}

// Admin hooks
export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiClient.adminGetCategories(),
  });
}

export function useAdminCategory(id: string) {
  return useQuery({
    queryKey: ["admin", "category", id],
    queryFn: () => apiClient.adminGetCategoryById(id),
    enabled: !!id,
  });
}

export function useAdminCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductCategory) => apiClient.adminCreateCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
      data: ProductCategory;
    }) => apiClient.adminUpdateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => apiClient.adminGetOrderById(id),
    enabled: !!id,
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

export function useAdminUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePaymentStatusRequest;
    }) => apiClient.adminUpdatePaymentStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "order"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useAdminProducts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => apiClient.adminGetProducts(),
    enabled: options?.enabled ?? true,
    retry: 1,
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => apiClient.adminGetProductById(id),
    enabled: !!id,
  });
}

export function useAdminCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Product) => apiClient.adminCreateProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAdminUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Product }) =>
      apiClient.adminUpdateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
    queryFn: () => apiClient.getUsers(),
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

