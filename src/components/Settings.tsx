import React, { useState } from 'react';
import { GasConfig, SliderItem } from '../types';
import { ConfigPanel } from './ConfigPanel';
import { SetupInstructions } from './SetupInstructions';
import { SliderConfig } from './SliderConfig';
import { Settings as SettingsIcon, Link2, ImageIcon, HelpCircle, ShieldCheck, FileSpreadsheet, LayoutDashboard, Sliders, Database, Save, Lock, Trash2 } from 'lucide-react';

interface SettingsProps {
  config: GasConfig;
  setConfig: (config: GasConfig) => void;
  slides: SliderItem[];
  showSlider: boolean;
  onSaveSlides: (slides: SliderItem[]) => void;
  onToggleShowSlider: (show: boolean) => void;
}

export function Settings({ 
  config, 
  setConfig,
  slides,
  showSlider,
  onSaveSlides,
  onToggleShowSlider
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'identity' | 'banner' | 'cloud' | 'sync' | 'security' | 'reset' | 'guide'>('identity');

  const tabs = [
    { id: 'identity', label: 'Identitas & Visual', icon: LayoutDashboard, category: 'Umum' },
    { id: 'banner', label: 'Banner Promosi', icon: ImageIcon, category: 'Umum' },
    { id: 'cloud', label: 'Koneksi Cloud', icon: Database, category: 'Sistem Database' },
    { id: 'sync', label: 'Backup & Sinkronisasi', icon: Save, category: 'Sistem Database' },
    { id: 'security', label: 'Kredensial Admin', icon: Lock, category: 'Keamanan & Lanjutan' },
    { id: 'guide', label: 'Panduan Setup', icon: HelpCircle, category: 'Keamanan & Lanjutan' },
    { id: 'reset', label: 'Reset Sistem', icon: Trash2, category: 'Keamanan & Lanjutan' }
  ] as const;

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[600px] w-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Sidebar Tabs */}
      <div className="w-64 bg-slate-50 border-r border-gray-200 flex flex-col h-full overflow-y-auto">
        <div className="p-6 pb-4 border-b border-gray-200/60 bg-white">
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2.5 text-gray-900">
            <SettingsIcon className="w-6 h-6 text-indigo-600" />
            Pengaturan
          </h2>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">Kelola konfigurasi sistem Kiosk</p>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Grouped Tabs */}
          {['Umum', 'Sistem Database', 'Keamanan & Lanjutan'].map(category => (
            <div key={category} className="space-y-1">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 px-3 mb-2">{category}</h4>
              <div className="space-y-0.5">
                {tabs.filter(t => t.category === category).map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left text-sm font-semibold ${
                        isActive 
                          ? (tab.id === 'reset' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700')
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${
                        isActive 
                          ? (tab.id === 'reset' ? 'text-rose-600' : 'text-indigo-600')
                          : 'text-gray-400'
                      }`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-50/50 h-full overflow-hidden p-6">
        <div className="h-full">
          {['identity', 'cloud', 'sync', 'security', 'reset'].includes(activeTab) && (
            <ConfigPanel 
              config={config} 
              onChange={setConfig}
              section={activeTab as any}
            />
          )}

          {activeTab === 'banner' && (
            <SliderConfig 
              config={config}
              slides={slides}
              showSlider={showSlider}
              onSaveSlides={onSaveSlides}
              onToggleShowSlider={onToggleShowSlider}
            />
          )}

          {activeTab === 'guide' && (
            <SetupInstructions />
          )}
        </div>
      </div>
    </div>
  );
}

