import React from "react";
import { useAuth } from "../contexts/AuthContext";
import LoginRegister from "../components/Auth/LoginRegister";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { currentUser, loading } = useAuth();

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

  // Only redirect to /chat if user is authenticated
  if (currentUser) {
    return <Navigate to="/chat" />;
  }

  // Otherwise show login form
  return <LoginRegister />;
};

export default Index;
