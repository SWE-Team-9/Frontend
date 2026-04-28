import React from 'react';
import { adminService } from "@/src/services/admin/adminService";
import { FiArrowLeft, FiUser, FiMusic, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';
import { ReportActions } from "@/src/components/admin/ReportActions";
import { OffenderCard } from '@/src/components/admin/OffenderCard';
import { AdminUser } from '@/src/types/admin';


export default async function ReportDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const report = await adminService.getReportById(id);
  type ModerationAction = {
  id: string;
  action_type: string;
  notes: string;
};

type User = {
  id: string;
  display_name?: string;
  handle?: string;
  account_status?: string;
};

  if (!report) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <FiAlertCircle className="mx-auto mb-4" size={48} />
        <p>Report not found or has been deleted.</p>
        <Link href="/admin/reports" className="text-orange-500 hover:underline mt-4 block">
          Return to list
        </Link>
      </div>
    );
  }

  const actions = report.previous_actions_on_target ?? [];
  let offender: User | null = null;

  
 

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/reports"
          className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Reports
        </Link>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            ID: {report.id}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Report Content */}
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                {report.category}
              </span>
              <span className="text-zinc-600 text-xs">
                 {new Date(report.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Moderation Review</h1>
            <p className="text-zinc-300 leading-relaxed italic border-l-4 border-zinc-700 pl-4 py-2 bg-zinc-950/50 rounded-r-xl">
              &quot;{report.description}&quot;
            </p>


            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
              <ReportActions reportId={report.id} />
            </div>
          </div>

          {/* Moderation History */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest text-zinc-500">
              Target Moderation History
            </h3>

            <div className="space-y-4">
              {actions.length > 0 ? (
                actions.map((action: ModerationAction) => (
                  <div key={action.id} className="flex gap-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800/50">
                    <div className="w-1 bg-orange-500 rounded-full" />
                    <div>
                      <p className="text-xs font-black text-orange-500 uppercase">
                        {action.action_type}
                      </p>
                      <p className="text-sm text-zinc-300 mt-1">
                        {action.notes}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-600 text-sm italic text-center py-4">
                  No previous history.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
         <OffenderCard report={report} />
          
          {/* Reporter Details Card */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Reporter</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                <FiUser className="text-zinc-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{report.reporter.display_name}</p>
                <p className="text-zinc-500 text-xs">@{report.reporter.handle}</p>
              </div>
            </div>
          </div>

          {/* Target Item Card */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Targeted Content</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                {report.target.type === 'TRACK' ? <FiMusic className="text-orange-500" /> : <FiUser className="text-orange-500" />}
              </div>
              <div>
                <p className="text-white font-bold text-sm truncate w-32">{report.target.title}</p>
                <p className="text-zinc-500 text-[10px] uppercase">{report.target.type}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}