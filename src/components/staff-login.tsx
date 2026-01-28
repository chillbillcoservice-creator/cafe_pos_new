"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Employee } from "@/lib/types";
import { useLanguage } from "@/contexts/language-context";
import { User, Shield, ChefHat, Utensils, Zap } from "lucide-react";

interface StaffLoginProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    employees: Employee[];
    onLogin: (employee: Employee) => void;
    isForced?: boolean;
}

export default function StaffLogin({ isOpen, onOpenChange, employees, onLogin, isForced = false }: StaffLoginProps) {
    const { t } = useLanguage();

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

    return (
        <Dialog open={isOpen} onOpenChange={isForced ? () => { } : onOpenChange}>
            <DialogContent className={cn("max-w-3xl border-none p-0 bg-transparent shadow-none", isForced && "close-button-hidden")}>
                <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">
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
                                onClick={() => {
                                    onLogin(employee);
                                    onOpenChange(false);
                                }}
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

                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
                            </button>
                        ))}
                    </div>

                    {!isForced && (
                        <div className="mt-8 pt-6 border-t border-border/50 flex justify-center">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
                                {t('Cancel')}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
