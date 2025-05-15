
import React from "react";
import { Message as MessageType } from "../../types/chat";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const { currentUser } = useAuth();
  const isOwnMessage = currentUser?.uid === message.senderId;
  
  // Format timestamp to readable time
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2 mb-4",
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary text-white text-xs">
          {getInitials(message.senderName || "User")}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex flex-col max-w-[70%]", isOwnMessage ? "items-end" : "items-start")}>
        {!isOwnMessage && (
          <span className="text-xs font-medium text-muted-foreground mb-1">
            {message.senderName}
          </span>
        )}
        <div
          className={cn(
            "rounded-lg p-3",
            isOwnMessage
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : "bg-muted rounded-tl-none"
          )}
        >
          <p className="text-sm">{message.text}</p>
          {message.imageUrl && (
            <img 
              src={message.imageUrl} 
              alt="Message attachment" 
              className="mt-2 rounded-md max-w-full max-h-60 object-contain"
            />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground mt-1">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default Message;
