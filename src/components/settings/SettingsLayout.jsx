import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsLayout({ navItems, activeSection, setActiveSection, children }) {
    return (
        <div className="mt-6 grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                <nav className="flex flex-col space-y-1">
                    {navItems.map(item => (
                        <Button
                            key={item.id}
                            variant={activeSection === item.id ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setActiveSection(item.id)}
                        >
                            <item.icon className="w-4 h-4 mr-3" />
                            {item.label}
                        </Button>
                    ))}
                </nav>
            </div>
            <div className="md:col-span-3">
                <Card>
                    <CardContent className="p-6">
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}