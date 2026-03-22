import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class SupportChatHubManager {
  private connection: HubConnection | null = null;
  private token: string | null = null;
  private currentConversationCustomerId: string | undefined;
  /** `null` = JoinConversation(undefined) (khách); string = admin theo customerId. */
  private lastJoinConversationArg: string | null = null;
  private hasJoinedConversationGroup = false;
  private messageHandlers = new Set<ReceiveMessageCallback>();
  private statusHandlers = new Set<StatusCallback>();
  private status: ConnectionStatus = "disconnected";

  private emitStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusHandlers.forEach((cb) => cb(status));
  }

  private createConnection(hubUrl: string, longPollingOnly: boolean) {
    const transport = longPollingOnly
      ? HttpTransportType.LongPolling
      : HttpTransportType.WebSockets |
        HttpTransportType.ServerSentEvents |
        HttpTransportType.LongPolling;

    return new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.token || "",
        transport,
        skipNegotiation: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();
  }

  private wireConnectionEvents(conn: HubConnection) {
    conn.on("ReceiveMessage", (message: SupportMessageDto) => {
      this.messageHandlers.forEach((cb) => cb(message));
    });

    conn.onreconnecting(() => {
      this.emitStatus("reconnecting");
    });

    conn.onreconnected(async () => {
      this.emitStatus("connected");
      if (this.hasJoinedConversationGroup) {
        try {
          await this.connection?.invoke(
            "JoinConversation",
            this.lastJoinConversationArg === null ? undefined : this.lastJoinConversationArg
          );
        } catch (e) {
          console.warn("[SupportChatHub] Re-join after reconnect failed:", e);
        }
      }
    });

    conn.onclose(() => {
      this.emitStatus("disconnected");
    });
  }

  async connect(token: string): Promise<boolean> {
    this.token = token;

    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      this.emitStatus("connected");
      return true;
    }

    const hubUrl = `${getApiBaseUrl()}/hubs/support-chat`;

    const tryStart = async (longPollingOnly: boolean): Promise<boolean> => {
      if (this.connection) {
        try {
          await this.connection.stop();
        } catch {
          /* ignore */
        }
        this.connection = null;
      }

      this.connection = this.createConnection(hubUrl, longPollingOnly);
      this.wireConnectionEvents(this.connection);

      this.emitStatus("reconnecting");
      await this.connection.start();
      this.emitStatus("connected");
      if (this.hasJoinedConversationGroup) {
        await this.connection.invoke(
          "JoinConversation",
          this.lastJoinConversationArg === null ? undefined : this.lastJoinConversationArg
        );
      }
      return true;
    };

    const maxAttempts = 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const longPollingOnly = attempt === 1;
      try {
        return await tryStart(longPollingOnly);
      } catch (error) {
        console.warn(
          `[SupportChatHub] Connect failed (attempt ${attempt + 1}/${maxAttempts}, longPollingOnly=${longPollingOnly}):`,
          error
        );
        if (attempt < maxAttempts - 1) {
          await sleep(800 * (attempt + 1));
        }
      }
    }

    this.emitStatus("disconnected");
    return false;
  }

  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        /* ignore */
      }
      this.connection = null;
      this.hasJoinedConversationGroup = false;
      this.lastJoinConversationArg = null;
      this.emitStatus("disconnected");
    }
  }

  async joinConversation(customerId?: string): Promise<boolean> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return false;
    }
    this.currentConversationCustomerId = customerId;
    this.lastJoinConversationArg = customerId === undefined ? null : customerId;
    this.hasJoinedConversationGroup = true;
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
    this.hasJoinedConversationGroup = false;
    this.lastJoinConversationArg = null;
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
