import type {
  PagedResultDto,
  SupportConversationDto,
  SupportConversationMessagesDto,
  SupportMessageDto,
} from "@/lib/api/types";

type PagingParams = {
  page?: number;
  pageSize?: number;
};

const getApiBaseUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://pickleballshop-backend.fly.dev";
  return url.replace(/\/$/, "");
};

const API_BASE_URL = getApiBaseUrl();

const buildQuery = (params?: PagingParams) => {
  const searchParams = new URLSearchParams();
  if (params?.page) {
    searchParams.set("page", String(params.page));
  }
  if (params?.pageSize) {
    searchParams.set("pageSize", String(params.pageSize));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Support chat request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export const supportChatService = {
  getMyConversation(params?: PagingParams) {
    return request<SupportConversationMessagesDto>(
      `/api/support-chat/my-conversation${buildQuery(params)}`
    );
  },

  sendMyMessage(content: string) {
    return request<SupportMessageDto>("/api/support-chat/my-conversation/messages", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  markMyConversationRead() {
    return request<void>("/api/support-chat/my-conversation/read", {
      method: "POST",
      body: "{}",
    });
  },

  getAdminConversations(params?: PagingParams) {
    return request<PagedResultDto<SupportConversationDto>>(
      `/api/admin/support-chat/conversations${buildQuery(params)}`
    );
  },

  getAdminConversationMessages(customerId: string, params?: PagingParams) {
    return request<SupportConversationMessagesDto>(
      `/api/admin/support-chat/conversations/${encodeURIComponent(customerId)}/messages${buildQuery(params)}`
    );
  },

  sendAdminMessage(customerId: string, content: string) {
    return request<SupportMessageDto>(
      `/api/admin/support-chat/conversations/${encodeURIComponent(customerId)}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    );
  },

  markAdminConversationRead(customerId: string) {
    return request<void>(
      `/api/admin/support-chat/conversations/${encodeURIComponent(customerId)}/read`,
      {
        method: "POST",
        body: "{}",
      }
    );
  },
};
