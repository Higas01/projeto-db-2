
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../../firebase/config";
import { ref, onValue, off, get } from "firebase/database";
import { Message as MessageType, Chat } from "../../types/chat";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const ChatWindow = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const { chatId } = useParams<{ chatId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) {
      navigate("/");
      return;
    }

    // Get chat details
    const chatRef = ref(database, `chats/${chatId}`);
    onValue(chatRef, (snapshot) => {
      if (!snapshot.exists()) {
        navigate("/");
        return;
      }
      
      const chatData = snapshot.val();
      setChat({
        id: chatId,
        ...chatData
      });
      
      // Check if user is part of this chat (unless it's public)
      if (
        chatData.type !== "public" &&
        currentUser &&
        !chatData.participants[currentUser.uid]
      ) {
        navigate("/");
        return;
      }
    });

    // Get messages
    const messagesRef = ref(database, `messages/${chatId}`);
    onValue(messagesRef, (snapshot) => {
      setLoading(false);
      if (!snapshot.exists()) {
        setMessages([]);
        return;
      }
      
      const messagesData = snapshot.val();
      const messagesList = Object.entries(messagesData).map(([id, data]: [string, any]) => ({
        id,
        ...data
      }));
      
      // Sort by timestamp
      messagesList.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(messagesList);
    });

    return () => {
      off(chatRef);
      off(messagesRef);
    };
  }, [chatId, currentUser, navigate]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-16 w-72" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2 md:hidden"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-medium">{chat?.name}</h2>
          <p className="text-xs text-muted-foreground">
            {chat?.type === "private" ? "Private Chat" : 
             chat?.type === "group" ? "Group Chat" : "Public Chat"}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <Message key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput chatId={chatId || ""} />
    </div>
  );
};

export default ChatWindow;
