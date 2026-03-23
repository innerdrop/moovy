/**
 * Support System Types
 * Shared interfaces for chat, operators, and canned responses
 */

export interface SupportChat {
  id: string;
  userId: string;
  merchantId?: string;
  operatorId?: string;
  subject?: string;
  category?: string;
  status: "waiting" | "active" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  rating?: number;
  ratingComment?: string;
  lastMessageAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name?: string;
    email: string;
    role?: string;
  };
  operator?: SupportOperator;
  messages?: SupportMessage[];
  unreadCount?: number;
  _count?: {
    messages: number;
  };
}

export interface SupportMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  isFromAdmin: boolean;
  isSystem: boolean;
  isRead: boolean;
  attachmentUrl?: string;
  attachmentType?: string;
  createdAt: Date;
  sender?: {
    id: string;
    name?: string;
    role?: string;
  };
}

export interface SupportOperator {
  id: string;
  userId: string;
  displayName: string;
  isActive: boolean;
  isOnline: boolean;
  maxChats: number;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  chats?: SupportChat[];
  activeChatCount?: number;
}

export interface CannedResponse {
  id: string;
  shortcut: string;
  title: string;
  content: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportChatWithDetails extends SupportChat {
  user: {
    id: string;
    name?: string;
    email: string;
    role?: string;
  };
  operator?: SupportOperator;
  messages: SupportMessage[];
  unreadCount: number;
}

export interface OperatorChatListItem extends SupportChat {
  user: {
    id: string;
    name?: string;
    email: string;
  };
  operator?: SupportOperator;
  _count: {
    messages: number;
  };
  unreadCount: number;
}
