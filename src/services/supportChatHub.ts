import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import type { SupportMessageDto } from "@/lib/api/types";

type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
type ReceiveMessageCallback = (message: SupportMessageDto) => void;
type StatusCallback = (status: ConnectionStatus) => void;

const getApiBaseUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://pickleballshop-backend.fly.dev";
  return url.replace(/\/$/, "");
};

class SupportChatHubManager {
  private connection: HubConnection | null = null;
  private token: string | null = null;
  private currentConversationCustomerId: string | undefined;
  private messageHandlers = new Set<ReceiveMessageCallback>();
  private statusHandlers = new Set<StatusCallback>();
  private status: ConnectionStatus = "disconnected";

  private emitStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusHandlers.forEach((cb) => cb(status));
  }

  async connect(token: string): Promise<boolean> {
    this.token = token;

    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      this.emitStatus("connected");
      return true;
    }

    if (!this.connection) {
      const hubUrl = `${getApiBaseUrl()}/hubs/support-chat`;
      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => this.token || "",
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      this.connection.on("ReceiveMessage", (message: SupportMessageDto) => {
        this.messageHandlers.forEach((cb) => cb(message));
      });

      this.connection.onreconnecting(() => {
        this.emitStatus("reconnecting");
      });

      this.connection.onreconnected(async () => {
        this.emitStatus("connected");
        if (this.currentConversationCustomerId !== undefined) {
          await this.joinConversation(this.currentConversationCustomerId);
        }
      });

      this.connection.onclose(() => {
        this.emitStatus("disconnected");
      });
    }

    if (this.connection.state === HubConnectionState.Disconnected) {
      this.emitStatus("reconnecting");
      try {
        await this.connection.start();
        this.emitStatus("connected");
        if (this.currentConversationCustomerId !== undefined) {
          await this.joinConversation(this.currentConversationCustomerId);
        }
        return true;
      } catch (error) {
        console.warn("[SupportChatHub] Connect failed:", error);
        this.emitStatus("disconnected");
        return false;
      }
    }

    return this.connection.state === HubConnectionState.Connected;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.emitStatus("disconnected");
    }
  }

  async joinConversation(customerId?: string): Promise<boolean> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return false;
    }
    this.currentConversationCustomerId = customerId;
    await this.connection.invoke("JoinConversation", customerId);
    return true;
  }

  async leaveConversation(customerId?: string) {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return;
    }
    await this.connection.invoke("LeaveConversation", customerId);
    if (this.currentConversationCustomerId === customerId) {
      this.currentConversationCustomerId = undefined;
    }
  }

  async sendMessage(customerId: string, content: string) {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error("SignalR is not connected");
    }
    await this.connection.invoke("SendMessage", customerId, content);
  }

  async markConversationRead(customerId?: string) {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error("SignalR is not connected");
    }
    await this.connection.invoke("MarkConversationRead", customerId);
  }

  onReceiveMessage(callback: ReceiveMessageCallback) {
    this.messageHandlers.add(callback);
  }

  offReceiveMessage(callback: ReceiveMessageCallback) {
    this.messageHandlers.delete(callback);
  }

  onStatusChange(callback: StatusCallback) {
    this.statusHandlers.add(callback);
  }

  offStatusChange(callback: StatusCallback) {
    this.statusHandlers.delete(callback);
  }

  getStatus() {
    return this.status;
  }
}

export const supportChatHub = new SupportChatHubManager();
export type { ConnectionStatus };
