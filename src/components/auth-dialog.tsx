"use client";

import { CardDescription } from "@/components/ui/card";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../hooks/use-auth";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LogIn,
  ArrowLeft,
} from "lucide-react";

export function AuthDialog() {
  const [open, setOpen] = useState(false);
  const { login, signup, loading, error, forgotPassword, setError } = useAuth();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: "",
    newPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    const success = await login(loginData.email, loginData.password);
    if (success) {
      setSuccessMessage("Login successful! Redirecting...");
      window.location.reload(); // full page reload
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    const success = await signup(
      signupData.name,
      signupData.email,
      signupData.password
    );
    if (success) {
      setSuccessMessage(
        "Signup successful! You are now logged in. Redirecting..."
      );
      window.location.reload(); // full page reload
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setError(null);
    const result = await forgotPassword(
      forgotPasswordData.email,
      forgotPasswordData.newPassword
    );
    if (result.success) {
      setSuccessMessage(result.message);
      setForgotPasswordData({ email: "", newPassword: "" });
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccessMessage(null);
      }, 3000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
          Get Started
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-7 border-none bg-[url('/topography.svg')] bg-repeat">
        <DialogHeader className="sr-only">
          <DialogTitle>BakeTrack Authentication</DialogTitle>
          <DialogDescription>
            Sign in or create an account to manage your meals and ingredients.
          </DialogDescription>
        </DialogHeader>
        <div className="flex h-full w-full items-center justify-center bg-wheat-50 rounded-lg">
          {!showForgotPassword ? (
            <Tabs defaultValue="login" className="w-full max-w-md">
              <div className="inline-flex items-center justify-center rounded-lg bg-wheat-100 text-pink-700 w-full p-1 mb-4">
                <TabsList className="grid w-full grid-cols-2 h-auto bg-transparent p-0">
                  <TabsTrigger
                    value="login"
                    className="w-full text-pink-700 font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-pink-700 rounded-md"
                  >
                    Log in
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="w-full text-pink-700 font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-pink-700 rounded-md"
                  >
                    Sign up
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="login">
                <Card className="border border-wheat-200 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-pink-700 font-bold text-2xl">
                      Welcome Back
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="grid gap-6">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label
                            htmlFor="login-email"
                            className="text-pink-800"
                          >
                            Email
                          </Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="your@email.com"
                            value={loginData.email}
                            onChange={(e) =>
                              setLoginData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            required
                            disabled={loading}
                            className="focus:ring-pink-400"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label
                            htmlFor="login-password"
                            className="text-pink-800"
                          >
                            Password
                          </Label>
                          <div className="flex gap-x-1">
                            <Input
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              value={loginData.password}
                              onChange={(e) =>
                                setLoginData((prev) => ({
                                  ...prev,
                                  password: e.target.value,
                                }))
                              }
                              required
                              disabled={loading}
                              className="focus:ring-pink-400"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              className="rounded-xl"
                              onClick={() => setShowPassword((p) => !p)}
                            >
                              {showPassword ? <EyeOff /> : <Eye />}
                            </Button>
                          </div>
                        </div>
                        {error && (
                          <Alert
                            variant="destructive"
                            className="bg-soft-pink-50 border-soft-pink-200 text-soft-pink-800"
                          >
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        {successMessage && (
                          <Alert className="bg-green-50 border-green-200 text-green-800">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                              {successMessage}
                            </AlertDescription>
                          </Alert>
                        )}
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 transition-all"
                        >
                          {loading && (
                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          )}
                          <LogIn className="mr-2 h-4 w-4" />
                          Log in
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          className="text-sm text-pink-600 hover:text-pink-700"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setError(null);
                            setSuccessMessage(null);
                          }}
                        >
                          Forgot password?
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card className="border border-wheat-200 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-pink-700 font-bold text-2xl">
                      Create Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignup} className="grid gap-6">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label
                            htmlFor="signup-name"
                            className="text-pink-800"
                          >
                            Name
                          </Label>
                          <Input
                            id="signup-name"
                            placeholder="Your Name"
                            value={signupData.name}
                            onChange={(e) =>
                              setSignupData((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            required
                            disabled={loading}
                            className="focus:ring-pink-400"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label
                            htmlFor="signup-email"
                            className="text-pink-800"
                          >
                            Email
                          </Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="your@email.com"
                            value={signupData.email}
                            onChange={(e) =>
                              setSignupData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            required
                            disabled={loading}
                            className="focus:ring-pink-400"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label
                            htmlFor="signup-password"
                            className="text-pink-800"
                          >
                            Password
                          </Label>
                          <div className="flex gap-x-1">
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              value={signupData.password}
                              onChange={(e) =>
                                setSignupData((prev) => ({
                                  ...prev,
                                  password: e.target.value,
                                }))
                              }
                              required
                              disabled={loading}
                              className="focus:ring-pink-400"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              className="rounded-xl"
                              onClick={() => setShowPassword((p) => !p)}
                            >
                              {showPassword ? <EyeOff /> : <Eye />}
                            </Button>
                          </div>
                        </div>
                        {error && (
                          <Alert
                            variant="destructive"
                            className="bg-soft-pink-50 border-soft-pink-200 text-soft-pink-800"
                          >
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        {successMessage && (
                          <Alert className="bg-green-50 border-green-200 text-green-800">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                              {successMessage}
                            </AlertDescription>
                          </Alert>
                        )}
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 transition-all"
                        >
                          {loading && (
                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          )}
                          Sign up
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="w-full max-w-md border border-bakery-200 shadow-md bg-bakery-50">
              <CardHeader>
                <CardTitle className="text-pink-700 font-bold text-2xl">
                  Reset Password
                </CardTitle>
                <CardDescription className="text-bakery-800">
                  Enter your email and new password to reset your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleForgotPasswordSubmit}
                  className="grid gap-6"
                >
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="forgot-email"
                        className="text-pink-800"
                      >
                        Email
                      </Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="your@email.com"
                        value={forgotPasswordData.email}
                        onChange={(e) =>
                          setForgotPasswordData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        required
                        disabled={loading}
                        className="focus:ring-pink-400"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="new-password"
                        className="text-pink-800"
                      >
                        New Password
                      </Label>
                      <div className="flex gap-x-1">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={forgotPasswordData.newPassword}
                          onChange={(e) =>
                            setForgotPasswordData((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          required
                          disabled={loading}
                          className="focus:ring-pink-400"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={() => setShowNewPassword((p) => !p)}
                        >
                          {showNewPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    </div>
                    {error && (
                      <Alert
                        variant="destructive"
                        className="bg-soft-pink-50 border-soft-pink-200 text-soft-pink-800"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {successMessage && (
                      <Alert className="bg-green-50 border-green-200 text-green-800">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{successMessage}</AlertDescription>
                      </Alert>
                    )}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 transition-all"
                    >
                      {loading && (
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      )}
                      Reset Password
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-pink-600 hover:text-pink-700"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
