
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth, database } from "../firebase/config";
import { ref, set } from "firebase/database";
import { User } from "../types/chat";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userData: User = {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName,
          photoURL: user.photoURL
        };
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Store user in database
      await set(ref(database, `users/${userCredential.user.uid}`), {
        email: email,
        displayName: name,
        photoURL: null,
        createdAt: Date.now()
      });
      
      toast({
        title: "Conta criada!",
        description: "Você se registrou com sucesso.",
      });
    } catch (error: any) {
      let errorMessage = "Erro no registro. Tente novamente.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está sendo usado por outra conta.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido.";
      }
      
      toast({
        title: "Falha no registro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Bem-vindo de volta!",
        description: "Login realizado com sucesso.",
      });
    } catch (error: any) {
      let errorMessage = "Falha no login. Tente novamente.";
      
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Esta conta foi desativada.";
      }
      
      toast({
        title: "Falha no login",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Desconectado",
        description: "Você saiu da sua conta com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Falha ao sair",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
