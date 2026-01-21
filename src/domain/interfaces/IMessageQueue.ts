export interface IMessageQueue {
  publish(topic: string, message: any): Promise<void>;
  subscribe(topic: string, handler: (message: any) => Promise<void>): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
