
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { database } from "../../firebase/config";
import { ref, onValue, off } from "firebase/database";
import { Chat } from "../../types/chat";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import NewChatModal from "./NewChatModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const ChatList = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();

  useEffect(() => {
    if (!currentUser) return;

    // Get public chats
    const publicChatsRef = ref(database, "chats");
    onValue(publicChatsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setChats([]);
        setLoading(false);
        return;
      }

      const chatsData = snapshot.val();
      const chatsList: Chat[] = [];

      Object.entries(chatsData).forEach(([id, data]: [string, any]) => {
        // Include chat if:
        // 1. It's public, OR
        // 2. Current user is a participant
        if (
          data.type === "public" || 
          (data.participants && data.participants[currentUser.uid])
        ) {
          chatsList.push({
            id,
            ...data
          });
        }
      });

      // Sort by last message timestamp (newest first)
      chatsList.sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || 0;
        const bTime = b.lastMessage?.timestamp || 0;
        return bTime - aTime;
      });

      setChats(chatsList);
      setLoading(false);
    });

    return () => {
      off(publicChatsRef);
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="w-full md:w-80 border-r min-h-screen p-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-9" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-80 border-r min-h-screen flex flex-col">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-bold text-lg">Firebase Chat</h1>
            <p className="text-sm text-muted-foreground">
              {currentUser?.displayName || currentUser?.email?.split("@")[0] || "User"}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          onClick={() => setModalOpen(true)}
          className="w-full mt-4"
        >
          <Plus className="h-4 w-4 mr-2" /> New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No chats available</p>
              <p className="text-sm mt-1">Create a new chat to start messaging</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  className={`block p-3 rounded-lg transition-colors ${
                    chatId === chat.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  <div className="flex justify-between">
                    <p className="font-medium truncate">{chat.name}</p>
                    <span className={`text-xs ${chatId === chat.id ? "text-primary-foreground" : "text-muted-foreground"}`}>
                      {chat.type === "private" ? "Private" : 
                       chat.type === "group" ? "Group" : "Public"}
                    </span>
                  </div>
                  {chat.lastMessage && (
                    <p className={`text-sm truncate mt-1 ${
                      chatId === chat.id ? "text-primary-foreground/90" : "text-muted-foreground"
                    }`}>
                      {chat.lastMessage.text}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <NewChatModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default ChatList;
