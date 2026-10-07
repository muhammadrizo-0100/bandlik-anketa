const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface RealtimeSurveyEvent {
  type: 'NEW_SURVEY' | 'HEARTBEAT';
  data?: {
    id: string;
    citizenFullName: string;
    citizenPinfl?: string;
    mahallaId?: string;
    mahallaName?: string;
    districtId?: string;
    surveyMethod?: string;
    mainCategory?: string;
    createdAt: string;
  };
}

type RealtimeCallback = (event: RealtimeSurveyEvent) => void;

class RealtimeNotificationService {
  private eventSource: EventSource | null = null;
  private listeners: Set<RealtimeCallback> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private reconnectTimer: any = null;

  constructor() {
    this.initBroadcastChannel();
    this.initStorageListener();
    this.connectSSE();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('bandlik_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.notifyListeners(event.data);
          }
        };
      } catch (e) {
        // BroadcastChannel mavjud emas
      }
    }
  }

  private initStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'bandlik_realtime_event' && event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            if (data && data.type) {
              this.notifyListeners(data);
            }
          } catch (e) {}
        }
      });
    }
  }

  private connectSSE() {
    if (typeof window === 'undefined' || !('EventSource' in window)) return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      const streamUrl = `${API_BASE_URL}/surveys/stream`;
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.type === 'NEW_SURVEY') {
            this.notifyListeners(payload);
          }
        } catch (e) {
          // heartbeat yoki bo'sh event
        }
      };

      this.eventSource.onerror = () => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Uzilish bo'lsa 8 soniyadan keyin qayta ulanish
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connectSSE();
          }, 8000);
        }
      };
    } catch (err) {
      // SSE xatolik
    }
  }

  public emitLocal(eventData: RealtimeSurveyEvent) {
    // 1. Shu oynadagi obunachilarga
    this.notifyListeners(eventData);

    // 2. Boshqa ochiq tablar (BroadcastChannel)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(eventData);
      } catch (e) {}
    }

    // 3. localStorage orqali sinxronizatsiya
    try {
      localStorage.setItem(
        'bandlik_realtime_event',
        JSON.stringify({ ...eventData, _ts: Date.now() }),
      );
    } catch (e) {}
  }

  public subscribe(callback: RealtimeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(data: RealtimeSurveyEvent) {
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (e) {
        console.error('Realtime callback xatoligi:', e);
      }
    });
  }
}

export const realtimeService = new RealtimeNotificationService();
