import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import { generateId } from '../lib/utils';
import { BottomSheet } from '../components/BottomSheet';
import { ArrowLeft, Plus, Trash2, FolderTree, Package, Search } from 'lucide-react';
import { AppScreen, FrequentGroup } from '../types';

export function TemplateManager({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  const { templates, setTemplates } = useAppStore();
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [activeGroup, setActiveGroup] = useState<FrequentGroup | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(tpl => 
      tpl.name.toLowerCase().includes(query) || 
      tpl.items.some(item => item.toLowerCase().includes(query))
    );
  }, [templates, searchQuery]);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setTemplates(prev => [...prev, {
      id: generateId(),
      name: newGroupName.trim(),
      items: []
    }]);
    setNewGroupName('');
    setIsAddGroupOpen(false);
  };

  const handleDeleteGroup = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeGroup) return;

    const inputItems = newItemName.split(',').map(item => item.trim()).filter(item => item.length > 0);
    if (inputItems.length === 0) return;

    setTemplates(prev => prev.map(g => {
      if (g.id === activeGroup.id) {
        return { ...g, items: [...g.items, ...inputItems] };
      }
      return g;
    }));
    setNewItemName('');
    setIsAddItemOpen(false);
  };

  const handleDeleteItem = (groupId: string, itemIdx: number) => {
    setTemplates(prev => prev.map(g => {
      if (g.id === groupId) {
        const newItems = [...g.items];
        newItems.splice(itemIdx, 1);
        return { ...g, items: newItems };
      }
      return g;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 pt-10 pb-4 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('dashboard')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Kategori Bawaan</h1>
        </div>
        <button 
          onClick={() => setIsAddGroupOpen(true)}
          className="text-emerald-600 font-medium text-sm flex items-center bg-emerald-50 px-3 py-1.5 rounded-full"
        >
          <Plus className="w-4 h-4 mr-1" /> Kategori
        </button>
      </div>

      <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari kategori atau barang..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-emerald-500 shadow-sm text-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredTemplates.map(group => (
          <div key={group.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <FolderTree className="w-5 h-5 text-emerald-600" />
                {group.name}
              </div>
              <button onClick={() => handleDeleteGroup(group.id)} className="p-2 -mr-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              {group.items.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">Belum ada item di kategori ini</div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {group.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center py-2.5 px-3 hover:bg-slate-50 rounded-lg transition-colors group">
                      <span className="text-slate-700">{item}</span>
                      <button 
                        onClick={() => handleDeleteItem(group.id, idx)}
                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-md transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button 
                onClick={() => { setActiveGroup(group); setIsAddItemOpen(true); }}
                className="w-full mt-2 py-3 border border-dashed border-emerald-200 rounded-xl text-emerald-600 font-medium text-sm flex items-center justify-center bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Tambah Barang Ke {group.name}
              </button>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center mt-10 text-slate-500">
            <Package className="w-10 h-10 mb-3 text-slate-300" />
            <p>{templates.length === 0 ? "Belum ada kategori tersimpan." : "Tidak ada kategori yang cocok."}</p>
          </div>
        )}
      </div>

      {/* Add Group Sheet */}
      <BottomSheet isOpen={isAddGroupOpen} onClose={() => setIsAddGroupOpen(false)} title="Kategori Baru">
        <form onSubmit={handleCreateGroup} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Kategori</label>
            <input 
              type="text" 
              required
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              placeholder="Contoh: Dokumen Penting"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-medium rounded-xl py-3.5 mt-2 hover:bg-emerald-700 active:scale-95 transition-all">
            Simpan Kategori
          </button>
        </form>
      </BottomSheet>

      {/* Add Item Sheet */}
      <BottomSheet isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} title={`Tambah ke ${activeGroup?.name || ''}`}>
        <form onSubmit={handleAddItem} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Barang</label>
            <input 
              type="text" 
              required
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              placeholder="Contoh: Paspor, Tiket, Kacamata..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-medium rounded-xl py-3.5 mt-2 hover:bg-emerald-700 active:scale-95 transition-all">
            Tambahkan
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
