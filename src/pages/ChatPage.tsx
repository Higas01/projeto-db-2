
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import ChatList from "../components/Chat/ChatList";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "../contexts/AuthContext";

const ChatPage = () => {
  const { currentUser, loading } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const showChatWindow = location.pathname !== "/chat";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  // Redirect to login page if user is not authenticated
  if (!currentUser) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen">
      {/* On mobile, only show chat list if not in a specific chat */}
      {(!isMobile || !showChatWindow) && <ChatList />}
      
      {/* On mobile, only show chat window if in a specific chat */}
      {(!isMobile || showChatWindow) && (
        showChatWindow ? (
          <Outlet />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center p-4">
              <h2 className="text-xl font-medium mb-2">Welcome to Firebase Chat</h2>
              <p className="text-muted-foreground">
                Select a chat from the sidebar or create a new one to start messaging
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ChatPage;
