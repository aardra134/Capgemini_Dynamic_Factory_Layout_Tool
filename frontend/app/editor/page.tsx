'use client';

import { AuthGuard } from '@/components/auth-guard';
import { GridEditor } from '@/components/admin/grid-editor';
import { logout, getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Factory, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { mapFactoryStructure } from '@/lib/api-adapters';

export default function EditorPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState('Admin Console');
  const [parentUrl, setParentUrl] = useState('/admin');

  useEffect(() => {
    setIsClient(true);
    
    const user = getCurrentUser();
    if (user?.role === 'developer') {
      setParentName('Developer Portal');
      setParentUrl('/developer');
    }

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const url = id ? `/api/layouts/${id}/view` : '/api/layouts/active';

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch layout');
        return res.json();
      })
      .then(data => {
        const mapped = mapFactoryStructure(data);
        setLayoutData(mapped.factory);
        setLayoutId(mapped.id);
        setLayoutName(mapped.name);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSaveFactory = async (factory: any) => {
    console.log('Factory triggered save:', factory);
    if (layoutId) {
      try {
        // 1. Prepare workstations array
        const workstations: any[] = [];
        factory.areas?.forEach((area: any) => {
          area.lines?.forEach((line: any) => {
            line.workCenters?.forEach((wc: any) => {
              workstations.push({
                ws_id: parseInt(wc.id),
                pos_x: wc.x,
                pos_y: wc.y,
                width: wc.width,
                length: wc.height
              });
            });
          });
        });

        // 2. Prepare areas array
        const areas: any[] = [];
        factory.areas?.forEach((area: any) => {
          areas.push({
            area_id: parseInt(area.id),
            pos_x: area.x,
            pos_y: area.y,
            width: area.width,
            length: area.height
          });
        });

        // Send granular updates
        if (workstations.length > 0) {
          await fetch(`/api/layouts/${layoutId}/sync`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workstations })
          });
        }

        if (areas.length > 0) {
          await fetch(`/api/layouts/${layoutId}/sync-areas`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ areas })
          });
        }
        
        // Commit version
        await fetch(`/api/layouts/${layoutId}/commit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version_name: factory.name || 'v-saved' })
        });

        console.log('Successfully saved to active layout record.');
      } catch (err) {
        console.error('Failed remotely saving layout:', err);
      }
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen flex-col bg-slate-50">
        {/* Header */}
        {getCurrentUser()?.role !== 'admin' && (
          <>
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
              <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <Factory className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">
                      Layout Editor {layoutName && <span className="text-indigo-600">- {layoutName}</span>}
                    </h1>
                    <p className="text-xs text-slate-500">Visual factory layout designer</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-emerald-700">Editor Active</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>

              {/* Breadcrumb */}
              <nav className="border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-xs sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                  <Link href={parentUrl} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    {parentName}
                  </Link>
                  <ChevronRight className="h-3 w-3 text-slate-300" />
                  <span className="text-indigo-600 font-medium">Layout Editor</span>
                </div>
              </nav>
            </header>
          </>
        )}

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {isClient && !loading ? (
            <GridEditor onSave={handleSaveFactory} initialFactory={layoutData} isAdmin={getCurrentUser()?.role === 'admin'} layoutId={layoutId} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-slate-400 bg-[#0f172a]">
              Loading layout...
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
