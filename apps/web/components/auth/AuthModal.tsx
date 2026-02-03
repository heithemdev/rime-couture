"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Sparkles, Loader2, X, ArrowLeft, ArrowRight, Lock, User, Phone, Mail } from "lucide-react";

// ==========================================
// ZOD SCHEMAS
// ==========================================

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signUpStartSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpVerifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

const forgotStartSchema = z.object({ 
  email: z.string().email("Invalid email address") 
});

const forgotVerifySchema = z.object({ 
  code: z.string().length(6, "Code must be 6 digits") 
});

const forgotResetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string().min(8, "Confirm your password")
}).refine(data => data.password === data.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpStartFormData = z.infer<typeof signUpStartSchema>;
type SignUpVerifyFormData = z.infer<typeof signUpVerifySchema>;
type ForgotStartData = z.infer<typeof forgotStartSchema>;
type ForgotVerifyData = z.infer<typeof forgotVerifySchema>;
type ForgotResetData = z.infer<typeof forgotResetSchema>;

type AuthView = 
  | "SIGN_IN" 
  | "SIGN_UP_START" 
  | "SIGN_UP_VERIFY" 
  | "FORGOT_START" 
  | "FORGOT_VERIFY" 
  | "FORGOT_RESET";

// ==========================================
// CHARACTER ANIMATION COMPONENTS
// ==========================================

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({ 
  size = 12, 
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY
}: PupilProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// ANIMATED CHARACTERS SCENE
// ==========================================

interface CharacterSceneProps {
  isTyping: boolean;
  showPassword: boolean;
  password: string;
}

function CharacterScene({ isTyping, showPassword, password }: CharacterSceneProps) {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking effect for purple character
  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Blinking effect for black character
  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Looking at each other animation when typing starts
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  // Purple sneaky peeking animation when typing password and it's visible
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => {
            setIsPurplePeeking(false);
          }, 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };

      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword, isPurplePeeking]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  return (
    <div className="relative z-20 flex items-end justify-center h-125">
      {/* Cartoon Characters */}
      <div className="relative" style={{ width: '550px', height: '400px' }}>
        {/* Purple tall rectangle character - Back layer */}
        <div 
          ref={purpleRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '70px',
            width: '180px',
            height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px',
            backgroundColor: '#6C3FF5',
            borderRadius: '10px 10px 0 0',
            zIndex: 1,
            transform: (password.length > 0 && showPassword)
              ? `skewX(0deg)`
              : (isTyping || (password.length > 0 && !showPassword))
                ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` 
                : `skewX(${purplePos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* Eyes */}
          <div 
            className="absolute flex gap-8 transition-all duration-700 ease-in-out"
            style={{
              left: (password.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + purplePos.faceX}px`,
              top: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`,
            }}
          >
            <EyeBall 
              size={18} 
              pupilSize={7} 
              maxDistance={5} 
              eyeColor="white" 
              pupilColor="#2D2D2D" 
              isBlinking={isPurpleBlinking}
              forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
              forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
            />
            <EyeBall 
              size={18} 
              pupilSize={7} 
              maxDistance={5} 
              eyeColor="white" 
              pupilColor="#2D2D2D" 
              isBlinking={isPurpleBlinking}
              forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
              forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
            />
          </div>
        </div>

        {/* Black tall rectangle character - Middle layer */}
        <div 
          ref={blackRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '240px',
            width: '120px',
            height: '310px',
            backgroundColor: '#2D2D2D',
            borderRadius: '8px 8px 0 0',
            zIndex: 2,
            transform: (password.length > 0 && showPassword)
              ? `skewX(0deg)`
              : isLookingAtEachOther
                ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                : (isTyping || (password.length > 0 && !showPassword))
                  ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
                  : `skewX(${blackPos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* Eyes */}
          <div 
            className="absolute flex gap-6 transition-all duration-700 ease-in-out"
            style={{
              left: (password.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + blackPos.faceX}px`,
              top: (password.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`,
            }}
          >
            <EyeBall 
              size={16} 
              pupilSize={6} 
              maxDistance={4} 
              eyeColor="white" 
              pupilColor="#2D2D2D" 
              isBlinking={isBlackBlinking}
              forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
              forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
            />
            <EyeBall 
              size={16} 
              pupilSize={6} 
              maxDistance={4} 
              eyeColor="white" 
              pupilColor="#2D2D2D" 
              isBlinking={isBlackBlinking}
              forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
              forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
            />
          </div>
        </div>

        {/* Orange semi-circle character - Front left */}
        <div 
          ref={orangeRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '0px',
            width: '240px',
            height: '200px',
            zIndex: 3,
            backgroundColor: '#FF9B6B',
            borderRadius: '120px 120px 0 0',
            transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* Eyes - just pupils, no white */}
          <div 
            className="absolute flex gap-8 transition-all duration-200 ease-out"
            style={{
              left: (password.length > 0 && showPassword) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
              top: (password.length > 0 && showPassword) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
            }}
          >
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
          </div>
        </div>

        {/* Yellow tall rectangle character - Front right */}
        <div 
          ref={yellowRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '310px',
            width: '140px',
            height: '230px',
            backgroundColor: '#E8D754',
            borderRadius: '70px 70px 0 0',
            zIndex: 4,
            transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* Eyes - just pupils, no white */}
          <div 
            className="absolute flex gap-6 transition-all duration-200 ease-out"
            style={{
              left: (password.length > 0 && showPassword) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
              top: (password.length > 0 && showPassword) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
            }}
          >
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
          </div>
          {/* Horizontal line for mouth */}
          <div 
            className="absolute w-20 h-1 bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
            style={{
              left: (password.length > 0 && showPassword) ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`,
              top: (password.length > 0 && showPassword) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// FORM VIEWS
// ==========================================

interface SignInViewProps {
  onSuccess: () => void;
  onSwitch: () => void;
  onForgot: () => void;
  onType: (typing: boolean) => void;
  onPeek: (show: boolean) => void;
  showPassword: boolean;
  setPassword: (pw: string) => void;
  serverError: string;
  setServerError: (msg: string) => void;
}

function SignInView({ 
  onSuccess, 
  onSwitch, 
  onForgot, 
  onType, 
  onPeek, 
  showPassword,
  setPassword,
  serverError, 
  setServerError 
}: SignInViewProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema)
  });

  const onSubmit = async (data: SignInFormData) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/sign-in", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data) 
      });
      const json = await res.json();
      if (!res.ok || !json.success) setServerError(json.error || "Invalid credentials");
      else onSuccess();
    } catch { 
      setServerError("Something went wrong"); 
    }
  };

  return (
    <div className="w-full max-w-105">
      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="size-4 text-primary" />
        </div>
        <span>Rimoucha</span>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back!</h1>
        <p className="text-muted-foreground text-sm">Please enter your details</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="anna@gmail.com"
            autoComplete="off"
            {...register("email")}
            onFocus={() => onType(true)}
            onBlur={() => onType(false)}
            className="h-12 bg-background border-border/60 focus:border-primary"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password", {
                onChange: (e) => {
                  setPassword(e.target.value);
                  setValue("password", e.target.value);
                }
              })}
              className="h-12 pr-10 bg-background border-border/60 focus:border-primary"
            />
            <button
              type="button"
              onClick={() => onPeek(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <Label
              htmlFor="remember"
              className="text-sm font-normal cursor-pointer"
            >
              Remember for 30 days
            </Label>
          </div>
          <button
            type="button"
            onClick={onForgot}
            className="text-sm text-primary hover:underline font-medium cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {serverError && (
          <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
            {serverError}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium" 
          size="lg" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : "Log in"}
        </Button>
      </form>

      {/* Sign Up Link */}
      <div className="text-center text-sm text-muted-foreground mt-8">
        Don&apos;t have an account?{" "}
        <button onClick={onSwitch} className="text-foreground font-medium hover:underline cursor-pointer">
          Sign Up
        </button>
      </div>
    </div>
  );
}

function SignUpStartView({ 
  onSuccess, 
  onSwitch, 
  onType,
  serverError, 
  setServerError 
}: {
  onSuccess: (data: SignUpStartFormData) => void;
  onSwitch: () => void;
  onType: (typing: boolean) => void;
  serverError: string;
  setServerError: (msg: string) => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpStartFormData>({
    resolver: zodResolver(signUpStartSchema)
  });

  const onSubmit = async (data: SignUpStartFormData) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/sign-up/start", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data) 
      });
      const json = await res.json();
      if (!res.ok || !json.success) setServerError(json.error || "Failed to start sign up");
      else onSuccess(data);
    } catch { 
      setServerError("Network error"); 
    }
  };

  return (
    <div className="w-full max-w-105">
      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="size-4 text-primary" />
        </div>
        <span>Rimoucha</span>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
        <p className="text-muted-foreground text-sm">Join Rimoucha to start shopping</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
            {serverError}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Jane Doe"
              {...register("name")}
              onFocus={() => onType(true)}
              onBlur={() => onType(false)}
              className="h-12 pl-10 bg-background border-border/60 focus:border-primary"
            />
          </div>
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              id="signup-email"
              type="email"
              placeholder="jane@example.com"
              {...register("email")}
              onFocus={() => onType(true)}
              onBlur={() => onType(false)}
              className="h-12 pl-10 bg-background border-border/60 focus:border-primary"
            />
          </div>
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">Phone (Optional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="0550..."
              {...register("phone")}
              onFocus={() => onType(true)}
              onBlur={() => onType(false)}
              className="h-12 pl-10 bg-background border-border/60 focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className="h-12 pl-10 bg-background border-border/60 focus:border-primary"
            />
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium" 
          size="lg" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <>Continue <ArrowRight className="ml-2 size-5" /></>}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground mt-8">
        Already a member?{" "}
        <button onClick={onSwitch} className="text-foreground font-medium hover:underline cursor-pointer">
          Sign in
        </button>
      </div>
    </div>
  );
}

function SignUpVerifyView({ 
  initialData, 
  onSuccess, 
  onBack, 
  serverError, 
  setServerError 
}: {
  initialData: SignUpStartFormData;
  onSuccess: () => void;
  onBack: () => void;
  serverError: string;
  setServerError: (msg: string) => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpVerifyFormData>({
    resolver: zodResolver(signUpVerifySchema)
  });

  const onSubmit = async (data: SignUpVerifyFormData) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/sign-up/complete", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: initialData.email, code: data.code }) 
      });
      const json = await res.json();
      if (!res.ok || !json.success) setServerError(json.error || "Verification failed");
      else onSuccess();
    } catch { 
      setServerError("Network error"); 
    }
  };

  return (
    <div className="w-full max-w-105">
      <button 
        onClick={onBack} 
        className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 group cursor-pointer"
      >
        <ArrowLeft className="mr-2 size-4 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      <div className="text-center mb-10">
        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Check your inbox</h1>
        <p className="text-muted-foreground text-sm">
          We sent a code to <span className="font-medium text-foreground">{initialData.email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
            {serverError}
          </div>
        )}
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-center block">Verification Code</Label>
          <Input
            {...register("code")}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="h-16 text-center text-2xl font-mono font-bold tracking-[0.4em] bg-background border-border/60 focus:border-primary"
          />
          {errors.code && <p className="text-sm text-red-500 text-center">{errors.code.message}</p>}
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium" 
          size="lg" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : "Complete Setup"}
        </Button>
      </form>
    </div>
  );
}

function ForgotStartView({ 
  onSuccess, 
  onBack,
  onType,
  serverError, 
  setServerError 
}: {
  onSuccess: (email: string) => void;
  onBack: () => void;
  onType: (typing: boolean) => void;
  serverError: string;
  setServerError: (msg: string) => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotStartData>({ 
    resolver: zodResolver(forgotStartSchema) 
  });

  const onSubmit = async (data: ForgotStartData) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/forgot/start", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data) 
      });
      const json = await res.json();
      if (!res.ok && json.message) setServerError(json.message);
      else onSuccess(data.email);
    } catch { 
      setServerError("Network error"); 
    }
  };

  return (
    <div className="w-full max-w-105">
      <button 
        onClick={onBack} 
        className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 group cursor-pointer"
      >
        <ArrowLeft className="mr-2 size-4 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Reset Password</h1>
        <p className="text-muted-foreground text-sm">Enter your email to receive a code</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
            {serverError}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="forgot-email" className="text-sm font-medium">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            onFocus={() => onType(true)}
            onBlur={() => onType(false)}
            className="h-12 bg-background border-border/60 focus:border-primary"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium" 
          size="lg" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : "Send Code"}
        </Button>
      </form>
    </div>
  );
}

function ForgotVerifyView({ 
  email, 
  onSuccess, 
  onBack, 
  serverError, 
  setServerError 
}: {
  email: string;
  onSuccess: (resetToken: string) => void;
  onBack: () => void;
  serverError: string;
  setServerError: (msg: string) => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotVerifyData>({ 
    resolver: zodResolver(forgotVerifySchema) 
  });

  const onSubmit = async (data: ForgotVerifyData) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/forgot/verify", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: data.code }) 
      });
      const json = await res.json();
      if (!res.ok || !json.success) setServerError(json.error || "Invalid code"); 
      else onSuccess(json.resetToken);
    } catch { 
      setServerError("Network error"); 
    }
  };

  return (
    <div className="w-full max-w-105">
      <button 
        onClick={onBack} 
        className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 group cursor-pointer"
      >
        <ArrowLeft className="mr-2 size-4 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      <div className="text-center mb-10">
        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Enter Code</h1>
        <p className="text-muted-foreground text-sm">
          Check <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
            {serverError}
          </div>
        )}
        
        <div className="space-y-2">
          <Input
            {...register("code")}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="h-16 text-center text-2xl font-mono font-bold tracking-[0.4em] bg-background border-border/60 focus:border-primary"
          />
          {errors.code && <p className="text-sm text-red-500 text-center">{errors.code.message}</p>}
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium" 
          size="lg" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : "Verify Code"}
        </Button>
      </form>
    </div>
  );
}

function ForgotResetView({ 
  email, 
  resetToken, 
  onSuccess, 
  serverError, 
  setServerError 
}: {
  email: string;
  resetToken: string;
  onSuccess: () => void;
  serverError: string;
  setServerError: (msg: string) => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotResetData>({ 
    resolver: zodResolver(forgotResetSchema) 
  });

  const onSubmit = async (data: ForgotResetData) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/forgot/complete", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetToken, password: data.password }) 
      });
      const json = await res.json();
      if (!res.ok || !json.success) setServerError(json.error || "Failed to reset password"); 
      else onSuccess();
    } catch { 
      setServerError("Network error"); 
    }
  };

  return (
    <div className="w-full max-w-105">
      <div className="text-center mb-10">
        <div className="size-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="size-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">New Password</h1>
        <p className="text-muted-foreground text-sm">Secure your account with a new password</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
            {serverError}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className="h-12 pl-10 bg-background border-border/60 focus:border-primary"
            />
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              {...register("confirm")}
              className="h-12 pl-10 bg-background border-border/60 focus:border-primary"
            />
          </div>
          {errors.confirm && <p className="text-sm text-red-500">{errors.confirm.message}</p>}
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium" 
          size="lg" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}

// ==========================================
// MAIN MODAL COMPONENT
// ==========================================

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [view, setView] = useState<AuthView>("SIGN_IN");
  const [signUpData, setSignUpData] = useState<SignUpStartFormData | null>(null);
  const [forgotData, setForgotData] = useState<{ email: string; resetToken?: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setView("SIGN_IN");
      setSignUpData(null);
      setForgotData(null);
      setServerError("");
      setIsTyping(false);
      setShowPassword(false);
      setPassword("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl bg-background rounded-2xl shadow-2xl overflow-hidden grid lg:grid-cols-2"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 size-10 rounded-full bg-background/80 hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm transition-all cursor-pointer"
        >
          <X className="size-5" />
        </button>

        {/* Left Content Section - Characters */}
        <div className="relative hidden lg:flex flex-col justify-between bg-linear-to-br from-primary/90 via-primary to-primary/80 p-12 text-primary-foreground overflow-hidden">
          <div className="relative z-20">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <div className="size-8 rounded-lg bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="size-4" />
              </div>
              <span>Rimoucha</span>
            </div>
          </div>

          <CharacterScene isTyping={isTyping} showPassword={showPassword} password={password} />

          <div className="relative z-20 flex items-center gap-8 text-sm text-primary-foreground/60">
            <span className="hover:text-primary-foreground transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-primary-foreground transition-colors cursor-pointer">
              Terms of Service
            </span>
          </div>

          {/* Decorative elements */}
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[20px_20px]" />
          <div className="absolute top-1/4 right-1/4 size-64 bg-primary-foreground/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 size-96 bg-primary-foreground/5 rounded-full blur-3xl" />
        </div>

        {/* Right Login Section */}
        <div className="flex items-center justify-center p-8 bg-background overflow-y-auto">
          {view === "SIGN_IN" && (
            <SignInView 
              onSuccess={() => window.location.reload()} 
              onSwitch={() => { setServerError(""); setView("SIGN_UP_START"); }}
              onForgot={() => { setServerError(""); setView("FORGOT_START"); }}
              onType={setIsTyping}
              onPeek={setShowPassword}
              showPassword={showPassword}
              setPassword={setPassword}
              serverError={serverError}
              setServerError={setServerError}
            />
          )}
          
          {view === "SIGN_UP_START" && (
            <SignUpStartView 
              onSuccess={(data) => { setSignUpData(data); setServerError(""); setView("SIGN_UP_VERIFY"); }}
              onSwitch={() => { setServerError(""); setView("SIGN_IN"); }}
              onType={setIsTyping}
              serverError={serverError}
              setServerError={setServerError}
            />
          )}

          {view === "SIGN_UP_VERIFY" && signUpData && (
            <SignUpVerifyView 
              initialData={signUpData}
              onSuccess={() => window.location.reload()}
              onBack={() => { setServerError(""); setView("SIGN_UP_START"); }}
              serverError={serverError}
              setServerError={setServerError}
            />
          )}

          {view === "FORGOT_START" && (
            <ForgotStartView 
              onSuccess={(email) => { setForgotData({ email }); setServerError(""); setView("FORGOT_VERIFY"); }}
              onBack={() => { setServerError(""); setView("SIGN_IN"); }}
              onType={setIsTyping}
              serverError={serverError}
              setServerError={setServerError}
            />
          )}

          {view === "FORGOT_VERIFY" && forgotData && (
            <ForgotVerifyView
              email={forgotData.email}
              onSuccess={(resetToken) => { setForgotData({ ...forgotData, resetToken }); setServerError(""); setView("FORGOT_RESET"); }}
              onBack={() => { setServerError(""); setView("FORGOT_START"); }}
              serverError={serverError}
              setServerError={setServerError}
            />
          )}

          {view === "FORGOT_RESET" && forgotData?.resetToken && (
            <ForgotResetView
              email={forgotData.email}
              resetToken={forgotData.resetToken}
              onSuccess={() => { setServerError(""); setView("SIGN_IN"); }}
              serverError={serverError}
              setServerError={setServerError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
