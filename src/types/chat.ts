
export type ChatType = "private" | "group" | "public";

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  imageUrl?: string;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  participants: Record<string, boolean>;
  lastMessage?: {
    text: string;
    timestamp: number;
  };
  createdBy: string;
}
