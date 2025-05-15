
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../../firebase/config";
import { ref, push, set, get } from "firebase/database";
import { useAuth } from "../../contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { User, ChatType } from "../../types/chat";
import { useToast } from "@/components/ui/use-toast";

interface NewChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ open, onOpenChange }) => {
  const [chatName, setChatName] = useState("");
  const [chatType, setChatType] = useState<ChatType>("private");
  const [users, setUsers] = useState<Record<string, User>>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Reset form state
      setChatName("");
      setChatType("private");
      setSelectedUsers([]);

      // Fetch users for group chats
      const usersRef = ref(database, "users");
      get(usersRef).then((snapshot) => {
        if (!snapshot.exists() || !currentUser) return;
        
        const usersData = snapshot.val();
        const usersObj: Record<string, User> = {};
        
        Object.entries(usersData).forEach(([uid, userData]: [string, any]) => {
          // Don't include current user in the list
          if (uid !== currentUser.uid) {
            usersObj[uid] = {
              uid,
              email: userData.email,
              displayName: userData.displayName || userData.email.split("@")[0],
              photoURL: userData.photoURL
            };
          }
        });
        
        setUsers(usersObj);
      }).catch(error => {
        console.error("Error fetching users:", error);
      });
    }
  }, [open, currentUser]);

  const handleCreateChat = async () => {
    if (!currentUser) return;
    
    if (!chatName.trim()) {
      toast({
        title: "Missing chat name",
        description: "Please enter a name for your chat",
        variant: "destructive"
      });
      return;
    }
    
    if (chatType === "private" && selectedUsers.length !== 1) {
      toast({
        title: "Select one user",
        description: "Please select exactly one user for a private chat",
        variant: "destructive"
      });
      return;
    }
    
    if (chatType === "group" && selectedUsers.length === 0) {
      toast({
        title: "Select users",
        description: "Please select at least one user for a group chat",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      
      // Create participants object (always include current user)
      const participants: Record<string, boolean> = {
        [currentUser.uid]: true
      };
      
      if (chatType !== "public") {
        selectedUsers.forEach(userId => {
          participants[userId] = true;
        });
      }
      
      // Create new chat
      const newChatRef = push(ref(database, "chats"));
      await set(newChatRef, {
        name: chatName,
        type: chatType,
        participants,
        createdBy: currentUser.uid,
        createdAt: Date.now()
      });
      
      // Close modal and navigate to new chat
      onOpenChange(false);
      navigate(`/chat/${newChatRef.key}`);
      
      toast({
        title: "Chat created",
        description: `Your ${chatType} chat has been created successfully`,
      });
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Failed to create chat",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    if (chatType === "private") {
      // In private chat, only one user can be selected
      setSelectedUsers([userId]);
    } else {
      // In group chat, toggle selection
      setSelectedUsers(prev => 
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="chat-name">Chat Name</Label>
            <Input
              id="chat-name"
              placeholder="Enter chat name"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Chat Type</Label>
            <RadioGroup value={chatType} onValueChange={(value) => {
              setChatType(value as ChatType);
              setSelectedUsers([]);
            }}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private">Private (1:1)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="group" />
                <Label htmlFor="group">Group</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public">Public</Label>
              </div>
            </RadioGroup>
          </div>
          
          {chatType !== "public" && (
            <div className="space-y-2">
              <Label>Select Users</Label>
              <ScrollArea className="h-60 border rounded-md p-2">
                {Object.keys(users).length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No users available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Object.values(users).map((user) => (
                      <div key={user.uid} className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${user.uid}`}
                          checked={selectedUsers.includes(user.uid)}
                          onCheckedChange={() => handleUserSelect(user.uid)}
                        />
                        <Label htmlFor={`user-${user.uid}`} className="flex-1 cursor-pointer">
                          {user.displayName || user.email}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateChat}
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create Chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatModal;
