import React from 'react';
import { History, ShieldCheck, Eye, Clock } from 'lucide-react';
import { AuditLog } from '../types.ts';
import { formatDate } from '../utils/formatters.ts';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold uppercase tracking-wider">
              GOVERNANÇA & SEGURANÇA
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Logs de Auditoria do Sistema
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Histórico completo de alterações realizadas por administradores para prestação de contas.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              HISTÓRICO DE AÇÕES ({logs.length} registros)
            </h3>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Nenhuma alteração registrada até o momento.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/80 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.userRole === 'admin'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      {log.userRole.toUpperCase()}
                    </span>
                    <span className="font-bold text-slate-800">{log.action}</span>
                  </div>
                  <div className="text-slate-600">{log.details}</div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] whitespace-nowrap self-start sm:self-auto">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(log.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
