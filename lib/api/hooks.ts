import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  AddCartItemRequest,
  UpdateCartItemRequest,
  CreateOrderRequest,
  ProductCategory,
  Product,
  UpdateOrderStatusRequest,
  OrderStatus,
  PaymentStatus,
} from "./types";

// Auth hooks
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data),
    onSuccess: (data) => {
      apiClient.setAccessToken(data.accessToken);
      queryClient.setQueryData(["user"], data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.register(data),
    onSuccess: (data) => {
      apiClient.setAccessToken(data.accessToken);
      queryClient.setQueryData(["user"], data.user);
    },
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: (data: RefreshTokenRequest) => apiClient.refreshToken(data),
    onSuccess: (data) => {
      apiClient.setAccessToken(data.accessToken);
    },
  });
}

export function useGoogleAuthLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idToken: string) => apiClient.loginWithGoogle(idToken),
    onSuccess: (data) => {
      apiClient.setAccessToken(data.accessToken);
      queryClient.setQueryData(["user"], data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RefreshTokenRequest) => apiClient.logout(data),
    onSuccess: () => {
      apiClient.setAccessToken(null);
      queryClient.clear();
    },
  });
}

// Categories hooks
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.getCategories(),
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
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => apiClient.getCart(),
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCartItemRequest) => apiClient.addCartItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useDeleteCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartItemId: string) => apiClient.deleteCartItem(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

// Orders hooks
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => apiClient.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
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

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => apiClient.adminGetProducts(),
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

