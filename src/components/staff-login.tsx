"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Employee } from "@/lib/types";
import { useLanguage } from "@/contexts/language-context";
import { User, Shield, ChefHat, Utensils, Zap, ArrowLeft } from "lucide-react";

interface StaffLoginProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    employees: Employee[];
    onLogin: (employee: Employee) => void;
    isForced?: boolean;
}

export default function StaffLogin({ isOpen, onOpenChange, employees, onLogin, isForced = false }: StaffLoginProps) {
    const { t } = useLanguage();
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [shake, setShake] = useState(false);
    const pinRef = useRef<HTMLInputElement>(null);

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'Admin': return <Shield className="h-5 w-5" />;
            case 'Manager': return <Zap className="h-5 w-5" />;
            case 'Head Chef':
            case 'Chef': return <ChefHat className="h-5 w-5" />;
            case 'Waiter': return <Utensils className="h-5 w-5" />;
            default: return <User className="h-5 w-5" />;
        }
    };

    const handleSelectEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setPin("");
        setError("");
        setTimeout(() => pinRef.current?.focus(), 100);
    };

    const handlePinSubmit = () => {
        if (!selectedEmployee) return;
        const correctPin = selectedEmployee.loginCode || "0000";
        if (pin === correctPin) {
            onLogin(selectedEmployee);
            onOpenChange(false);
            // Reset state for next open
            setTimeout(() => { setSelectedEmployee(null); setPin(""); setError(""); }, 300);
        } else {
            setError("Incorrect PIN. Try again.");
            setPin("");
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    const handleBack = () => {
        setSelectedEmployee(null);
        setPin("");
        setError("");
    };

    const handleClose = () => {
        if (isForced) return;
        setSelectedEmployee(null);
        setPin("");
        setError("");
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className={cn("max-w-3xl border-none p-0 bg-transparent shadow-none", isForced && "close-button-hidden")}>
                <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">

                    {/* ── Step 1: Pick a profile ── */}
                    {!selectedEmployee && (
                        <>
                            <DialogHeader className="mb-8 text-center">
                                <DialogTitle className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
                                    {t('Who is working?')}
                                </DialogTitle>
                                <DialogDescription className="text-lg">
                                    {t('Select your profile to continue')}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {employees.map((employee) => (
                                    <button
                                        key={employee.id}
                                        onClick={() => handleSelectEmployee(employee)}
                                        className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-muted/30 hover:bg-primary/10 border border-transparent hover:border-primary/50 transition-all duration-300 active:scale-95"
                                    >
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:shadow-primary/20 group-hover:scale-110 transition-all duration-300",
                                            employee.color || 'bg-primary'
                                        )}>
                                            {getRoleIcon(employee.role)}
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-lg group-hover:text-primary transition-colors">{employee.name}</p>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{employee.role}</p>
                                        </div>
                                        <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
                                    </button>
                                ))}
                            </div>

                            {!isForced && (
                                <div className="mt-8 pt-6 border-t border-border/50 flex justify-center">
                                    <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">
                                        {t('Cancel')}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Step 2: Enter PIN ── */}
                    {selectedEmployee && (
                        <>
                            <DialogHeader className="mb-6 text-center">
                                <div className={cn(
                                    "w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-4",
                                    selectedEmployee.color || 'bg-primary'
                                )}>
                                    {getRoleIcon(selectedEmployee.role)}
                                </div>
                                <DialogTitle className="text-2xl font-black">
                                    {selectedEmployee.name}
                                </DialogTitle>
                                <DialogDescription className="text-base">
                                    Enter your 4-digit PIN to continue
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-col items-center gap-4">
                                <input
                                    ref={pinRef}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={pin}
                                    onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
                                    onKeyDown={e => e.key === "Enter" && handlePinSubmit()}
                                    className={cn(
                                        "w-48 h-16 text-center text-4xl font-black tracking-[0.5em] rounded-xl border bg-muted/30 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all",
                                        shake && "animate-shake",
                                        error ? "border-red-500" : "border-border"
                                    )}
                                    placeholder="• • • •"
                                />

                                {error && (
                                    <p className="text-sm text-red-500 font-medium">{error}</p>
                                )}

                                <Button
                                    onClick={handlePinSubmit}
                                    disabled={pin.length !== 4}
                                    className="w-48 h-11 font-bold"
                                >
                                    Sign In
                                </Button>

                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
                                >
                                    <ArrowLeft size={14} /> Back to profiles
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
            <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}.animate-shake{animation:shake .45s ease-in-out}`}</style>
        </Dialog>
    );
}
