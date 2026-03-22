import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
} from "@microsoft/signalr";
import type {
  NewOrderNotification,
  NewSupportMessageNotification,
} from "@/lib/api/types";

type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
type NewOrderCallback = (payload: NewOrderNotification) => void;
type NewSupportMessageCallback = (payload: NewSupportMessageNotification) => void;
type StatusCallback = (status: ConnectionStatus) => void;

const getApiBaseUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://pickleballshop-backend.fly.dev";
  return url.replace(/\/$/, "");
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class AdminNotificationsHubManager {
  private connection: HubConnection | null = null;
  private token: string | null = null;
  private newOrderHandlers = new Set<NewOrderCallback>();
  private newSupportMessageHandlers = new Set<NewSupportMessageCallback>();
  private statusHandlers = new Set<StatusCallback>();
  private status: ConnectionStatus = "disconnected";

  private emitStatus(s: ConnectionStatus) {
    this.status = s;
    this.statusHandlers.forEach((cb) => cb(s));
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
    conn.on("NewOrder", (payload: NewOrderNotification) => {
      this.newOrderHandlers.forEach((cb) => cb(payload));
    });

    conn.on("NewSupportMessage", (payload: NewSupportMessageNotification) => {
      this.newSupportMessageHandlers.forEach((cb) => cb(payload));
    });

    conn.onreconnecting(() => {
      this.emitStatus("reconnecting");
    });

    conn.onreconnected(() => {
      this.emitStatus("connected");
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

    const hubUrl = `${getApiBaseUrl()}/hubs/admin-notifications`;

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
      return true;
    };

    const maxAttempts = 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const longPollingOnly = attempt === 1;
      try {
        return await tryStart(longPollingOnly);
      } catch (error) {
        console.warn(
          `[AdminNotificationsHub] Connect failed (attempt ${attempt + 1}/${maxAttempts}, longPollingOnly=${longPollingOnly}):`,
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
      this.emitStatus("disconnected");
    }
  }

  onNewOrder(callback: NewOrderCallback) {
    this.newOrderHandlers.add(callback);
  }

  offNewOrder(callback: NewOrderCallback) {
    this.newOrderHandlers.delete(callback);
  }

  onNewSupportMessage(callback: NewSupportMessageCallback) {
    this.newSupportMessageHandlers.add(callback);
  }

  offNewSupportMessage(callback: NewSupportMessageCallback) {
    this.newSupportMessageHandlers.delete(callback);
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

export const adminNotificationsHub = new AdminNotificationsHubManager();

export type AdminNotificationsConnectionStatus = ConnectionStatus;
