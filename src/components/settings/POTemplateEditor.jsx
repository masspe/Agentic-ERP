import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { CompanyProfile } from "@/api/entities";
import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";

const templates = [
  { 
    id: 'modern', 
    name: 'Modern Purple',
    preview: 'Clean layout with purple accents and modern typography'
  },
  { 
    id: 'classic', 
    name: 'Professional Classic',
    preview: 'Traditional business format with elegant styling'
  },
  { 
    id: 'minimal', 
    name: 'Minimal Clean',
    preview: 'Simple, clean design with minimal elements'
  },
  { 
    id: 'corporate', 
    name: 'Corporate Style',
    preview: 'Professional corporate look with structured layout'
  },
  { 
    id: 'elegant', 
    name: 'Elegant Design',
    preview: 'Sophisticated design with refined typography'
  },
  { 
    id: 'creative', 
    name: 'Creative Layout',
    preview: 'Modern creative design with unique elements'
  }
];

const colors = [
  { color: '#8b5cf6', name: 'Purple' },
  { color: '#3b82f6', name: 'Blue' },
  { color: '#10b981', name: 'Green' },
  { color: '#ef4444', name: 'Red' },
  { color: '#f97316', name: 'Orange' },
  { color: '#14b8a6', name: 'Teal' },
  { color: '#6b7280', name: 'Gray' },
  { color: '#000000', name: 'Black' }
];

export default function POTemplateEditor() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const profiles = await CompanyProfile.list();
            if (profiles.length > 0) {
                setProfile(profiles[0]);
            } else {
                setProfile({ 
                    po_template_style: 'modern', 
                    po_template_color: '#8b5cf6' 
                });
            }
            setIsLoading(false);
        };
        fetchProfile();
    }, []);
    
    const handleSave = async () => {
        if (!profile) return;
        if (profile.id) {
            await CompanyProfile.update(profile.id, {
                po_template_style: profile.po_template_style,
                po_template_color: profile.po_template_color,
            });
        } else {
            const newProfile = await CompanyProfile.create({
                company_name: "Your Company",
                po_template_style: profile.po_template_style,
                po_template_color: profile.po_template_color,
            });
            setProfile(newProfile);
        }
        alert("PO template saved!");
    };
    
    if (isLoading) return <Skeleton className="w-full h-96"/>;

    const renderPreview = () => {
        const style = profile.po_template_style;
        const color = profile.po_template_color;
        
        switch (style) {
            case 'modern':
                return (
                    <div className="p-6 bg-white h-full">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold" style={{color}}>YOUR COMPANY</h1>
                                <div className="w-16 h-1 mt-1" style={{backgroundColor: color}}></div>
                                <p className="text-xs mt-2 text-gray-600">123 Business St, City</p>
                            </div>
                            <div className="text-right">
                                <div className="px-3 py-1 rounded text-white text-xs" style={{backgroundColor: color}}>
                                    PURCHASE ORDER
                                </div>
                                <p className="text-xs mt-1">#PO-001</p>
                            </div>
                        </div>
                        <div className="border rounded p-3 mb-4">
                            <p className="text-xs font-semibold">Supplier:</p>
                            <p className="text-xs">Supplier Name</p>
                        </div>
                        <div className="border-t border-b py-2">
                            <div className="flex text-xs font-semibold" style={{color}}>
                                <span className="flex-1">Item</span>
                                <span className="w-16">Qty</span>
                                <span className="w-20 text-right">Amount</span>
                            </div>
                        </div>
                    </div>
                );
            case 'classic':
                return (
                    <div className="p-6 bg-white h-full">
                        <div className="text-center mb-6" style={{borderBottom: `3px solid ${color}`}}>
                            <h1 className="text-2xl font-bold mb-1">YOUR COMPANY</h1>
                            <p className="text-xs text-gray-600 pb-3">Professional Services</p>
                        </div>
                        <div className="flex justify-between mb-4">
                            <div>
                                <h2 className="font-bold text-sm" style={{color}}>PURCHASE ORDER</h2>
                                <p className="text-xs">PO #: PO-001</p>
                                <p className="text-xs">Date: Today</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold">Supplier:</p>
                                <p className="text-xs">Supplier Name</p>
                                <p className="text-xs">Supplier Address</p>
                            </div>
                        </div>
                        <table className="w-full text-xs">
                            <thead style={{backgroundColor: color, color: 'white'}}>
                                <tr>
                                    <th className="text-left p-1">Description</th>
                                    <th className="text-right p-1">Amount</th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                );
            case 'minimal':
                return (
                    <div className="p-6 bg-white h-full">
                        <div className="flex justify-between items-start mb-8">
                            <h1 className="text-2xl font-light">YOUR COMPANY</h1>
                            <div className="text-right">
                                <h2 className="text-lg font-light" style={{color}}>Purchase Order</h2>
                                <p className="text-xs">#001</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-xs font-medium" style={{color}}>From:</p>
                                <p className="text-xs">Your Company</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{color}}>To:</p>
                                <p className="text-xs">Supplier Name</p>
                            </div>
                        </div>
                        <div style={{borderTop: `1px solid ${color}`}} className="pt-3">
                            <div className="flex text-xs">
                                <span className="flex-1">Item</span>
                                <span className="w-20 text-right">Total</span>
                            </div>
                        </div>
                    </div>
                );
            case 'corporate':
                return (
                    <div className="p-6 bg-white h-full">
                        <div className="bg-gray-50 p-4 mb-4">
                            <div className="flex justify-between items-center">
                                <h1 className="text-xl font-bold">YOUR COMPANY</h1>
                                <div className="w-8 h-8 rounded" style={{backgroundColor: color}}></div>
                            </div>
                        </div>
                        <div className="flex justify-between mb-4">
                            <div>
                                <h2 className="font-bold" style={{color}}>PURCHASE ORDER</h2>
                                <p className="text-xs">No: PO-001</p>
                            </div>
                            <div className="text-right text-xs">
                                <p>Date: Today</p>
                                <p>Required By: +14 days</p>
                            </div>
                        </div>
                        <div className="border p-3 mb-4">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="font-semibold">Supplier:</p>
                                    <p>Supplier Name</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Delivery Terms:</p>
                                    <p>FOB Origin</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'elegant':
                return (
                    <div className="p-6 bg-white h-full">
                        <div className="text-center mb-6">
                            <div className="w-12 h-1 mx-auto mb-2" style={{backgroundColor: color}}></div>
                            <h1 className="text-2xl font-serif">YOUR COMPANY</h1>
                            <p className="text-xs italic text-gray-500">Excellence in Business</p>
                            <div className="w-12 h-1 mx-auto mt-2" style={{backgroundColor: color}}></div>
                        </div>
                        <div className="flex justify-between mb-6">
                            <div>
                                <h2 className="font-serif text-lg" style={{color}}>Purchase Order</h2>
                                <p className="text-xs">#PO-001</p>
                            </div>
                            <div className="text-right text-xs">
                                <p>Issued: Today</p>
                                <p>Required: +14 days</p>
                            </div>
                        </div>
                        <div className="border-l-4 pl-4 mb-4" style={{borderColor: color}}>
                            <p className="text-xs font-semibold">Supplier:</p>
                            <p className="text-xs">Supplier Name</p>
                            <p className="text-xs">Supplier Address</p>
                        </div>
                    </div>
                );
            case 'creative':
                return (
                    <div className="p-6 bg-white h-full">
                        <div className="relative mb-6">
                            <div className="absolute top-0 right-0 w-16 h-16 opacity-20" style={{backgroundColor: color}}></div>
                            <h1 className="text-2xl font-bold">YOUR COMPANY</h1>
                            <p className="text-xs text-gray-600">Strategic Purchasing</p>
                        </div>
                        <div className="flex items-center mb-4">
                            <div className="w-3 h-8 mr-3" style={{backgroundColor: color}}></div>
                            <div>
                                <h2 className="font-bold">PURCHASE ORDER</h2>
                                <p className="text-xs">#PO-001</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded mb-4">
                            <div className="flex justify-between text-xs">
                                <div>
                                    <p className="font-semibold">Supplier:</p>
                                    <p>Supplier Name</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">Date:</p>
                                    <p>Today</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div className="p-6">Select a template</div>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <Label className="font-semibold text-base">Template Style</Label>
                        <p className="text-sm text-slate-500 mb-4">Choose from our collection of professional PO designs</p>
                        <div className="grid grid-cols-2 gap-3">
                            {templates.map(t => (
                                <button 
                                    key={t.id} 
                                    onClick={() => setProfile(p => ({...p, po_template_style: t.id}))} 
                                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                                        profile.po_template_style === t.id 
                                            ? 'border-purple-600 ring-2 ring-purple-200 bg-purple-50' 
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="font-medium text-sm">{t.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">{t.preview}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <Label className="font-semibold text-base">Brand Color</Label>
                        <p className="text-sm text-slate-500 mb-4">Select your brand's primary color</p>
                        <div className="grid grid-cols-4 gap-3">
                           {colors.map(({color, name}) => (
                               <button 
                                   key={color} 
                                   onClick={() => setProfile(p => ({...p, po_template_color: color}))} 
                                   className={`p-3 border-2 rounded-lg flex items-center gap-2 transition-all ${
                                       profile.po_template_color === color 
                                           ? 'border-slate-600 ring-2 ring-slate-200' 
                                           : 'border-slate-200 hover:border-slate-300'
                                   }`}
                               >
                                   <div 
                                       className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                                       style={{backgroundColor: color}}
                                   >
                                       {profile.po_template_color === color && (
                                           <Check className="w-4 h-4 text-white m-auto" />
                                       )}
                                   </div>
                                   <span className="text-xs font-medium">{name}</span>
                               </button>
                           ))}
                        </div>
                    </div>
                </div>
                
                <div>
                     <Label className="font-semibold text-base">Live Preview</Label>
                     <p className="text-sm text-slate-500 mb-4">See how your purchase order will look</p>
                     <div className="border-2 border-dashed border-slate-200 rounded-lg p-2 bg-slate-50 h-96 overflow-hidden">
                        <div className="w-full h-full bg-white shadow-lg rounded scale-75 origin-top-left transform">
                            {renderPreview()}
                        </div>
                     </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
                <Button onClick={handleSave} disabled={!profile} className="bg-purple-600 hover:bg-purple-700">
                    <Save className="w-4 h-4 mr-2" /> Save PO Template
                </Button>
            </div>
        </div>
    );
}