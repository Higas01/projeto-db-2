
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

const LoginRegister = () => {
  const { login, register } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Por favor, preencha todos os campos.");
      return;
    }

    setLoginError("");
    try {
      setIsSubmitting(true);
      await login(loginEmail, loginPassword);
    } catch (error) {
      console.error("Login error:", error);
      // O tratamento de erro específico já está no AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !registerName) {
      setRegisterError("Por favor, preencha todos os campos.");
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setRegisterError("");
    try {
      setIsSubmitting(true);
      await register(registerEmail, registerPassword, registerName);
    } catch (error) {
      console.error("Register error:", error);
      // O tratamento de erro específico já está no AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Firebase Chat App</CardTitle>
          <CardDescription>Connect with friends and communities</CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {loginError && (
                  <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md">
                    {loginError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                {registerError && (
                  <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md">
                    {registerError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Enter your name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Choose a password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginRegister;
