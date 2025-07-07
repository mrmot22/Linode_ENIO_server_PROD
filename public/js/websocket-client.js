/**
 * @typedef {object} Order
 * @property {number} price
 * @property {number} quantity
 * @property {number} [ownQuantity]
 */

/**
 * @typedef {object} Period
 * @property {string} start - ISO datetime string
 * @property {string} end - ISO datetime string
 * @property {boolean} isBlock
 * @property {string} tradingEnd - ISO datetime string
 */

/**
 * @typedef {object} Statistics
 * @property {string|null} [lastTradeTime] - ISO datetime string
 * @property {number|null} [lastPrice]
 * @property {number|null} [maxPrice]
 * @property {number|null} [minPrice]
 * @property {number|null} [totalVolume]
 * @property {number|null} [lastQuantity]
 * @property {string|null} [priceDirection]
 */

/**
 * @typedef {object} PeriodData
 * @property {Period} period
 * @property {Statistics} statistics
 * @property {Order[]} buyList
 * @property {Order[]} sellList
 */

/**
 * @typedef {object} OrderBookSnapshotPayload
 * @property {number} seqNo
 * @property {number} timeDelta
 * @property {PeriodData[]} data
 */

/**
 * @typedef {object} SnapshotMessage
 * @property {'snapshot' | 'snapshot_received'} type
 * @property {OrderBookSnapshotPayload} payload
 * @property {string} [timestamp] - ISO datetime string
 */

/**
 * @typedef {object} DbSavedMessage
 * @property {'db_saved'} type
 * @property {PeriodData[]} payload
 * @property {string} timestamp - ISO datetime string
 */

/**
 * @typedef {SnapshotMessage | DbSavedMessage} WebSocketMessage
 */

/**
 * @typedef {object} CandlestickDataPoint
 * @property {number} x - Timestamp (ms)
 * @property {number} o - Open
 * @property {number} h - High
 * @property {number} l - Low
 * @property {number} c - Close
 */

const WEBSOCKET_URL = 'wss://market.encare.tech';
// const WEBSOCKET_URL = 'ws://localhost:8765';

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.onMessageCallback = null;
    this.onOpenCallback = null;
    this.onCloseCallback = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds

    this.connect();
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected.');
      return;
    }

    this.socket = new WebSocket(WEBSOCKET_URL);

    this.socket.onopen = () => {
      console.log('WebSocket connected to', WEBSOCKET_URL);
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      if (this.onOpenCallback) {
        this.onOpenCallback();
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.debug('WebSocket message received:', data);
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, 'Raw data:', event.data);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Error event will usually be followed by a close event, where we handle reconnection
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}, WasClean: ${event.wasClean}`);
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
      this.handleReconnect();
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectInterval / 1000}s...`);
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      console.error('Maximum WebSocket reconnect attempts reached.');
    }
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  onOpen(callback) {
    this.onOpenCallback = callback;
  }

  onClose(callback) {
    this.onCloseCallback = callback;
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected. Cannot send message.');
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}
