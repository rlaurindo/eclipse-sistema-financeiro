import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';
import { ImportPreview, importHistoricalPeriods, parseHistoricalWorkbook } from '../services/historicalImport.ts';

interface Props { isOpen: boolean; onClose: () => void; onImported: () => Promise<void>; }

export const HistoricalImportModal: React.FC<Props> = ({ isOpen, onClose, onImported }) => {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [importing, setImporting] = useState(false);
  if (!isOpen) return null;

  const selectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(''); setStatus(''); setFileName(file.name);
    try { setPreview(parseHistoricalWorkbook(await file.arrayBuffer())); }
    catch (reason) { setPreview(null); setError(reason instanceof Error ? reason.message : 'Não foi possível analisar o ficheiro.'); }
  };

  const confirmImport = async () => {
    if (!preview?.periods.length) return;
    setImporting(true); setError('');
    try {
      const result = await importHistoricalPeriods(preview);
      setStatus(`${result.imported} período(s) importado(s); ${result.skipped} período(s) existente(s) ignorado(s).`);
      await onImported();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao importar.'); }
    finally { setImporting(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div><h2 className="flex items-center gap-2 text-lg font-black text-slate-900"><FileSpreadsheet className="h-5 w-5 text-emerald-600" />Importar histórico Excel</h2><p className="mt-1 text-xs text-slate-500">Analise o ficheiro antes de gravar períodos no Supabase.</p></div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>

      <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-sm font-bold text-slate-700 hover:border-blue-400">
        <Upload className="h-5 w-5" />{fileName || 'Selecionar ficheiro .xlsx'}
        <input type="file" accept=".xlsx,.xls" onChange={selectFile} className="hidden" />
      </label>
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {status && <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="h-4 w-4" />{status}</div>}

      {preview && <div className="mt-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-blue-50 p-3"><div className="text-xs text-blue-700">Períodos</div><strong className="text-xl text-blue-900">{preview.periods.length}</strong></div>
          <div className="rounded-xl bg-emerald-50 p-3"><div className="text-xs text-emerald-700">Entradas</div><strong className="text-xl text-emerald-900">{preview.periods.reduce((sum, period) => sum + period.revenues.length, 0)}</strong></div>
          <div className="rounded-xl bg-red-50 p-3"><div className="text-xs text-red-700">Despesas</div><strong className="text-xl text-red-900">{preview.periods.reduce((sum, period) => sum + period.expenses.length, 0)}</strong></div>
        </div>
        {preview.warnings.map((warning) => <div key={warning} className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" />{warning}</div>)}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-xs"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="p-3">Período</th><th className="p-3">Origem</th><th className="p-3 text-right">Entradas</th><th className="p-3 text-right">Despesas</th><th className="p-3 text-right">Total despesas</th></tr></thead>
          <tbody>{preview.periods.map((period) => <tr key={period.key} className="border-t border-slate-100"><td className="p-3 font-bold">{period.name}</td><td className="p-3 text-slate-500">{period.sourceSheet}</td><td className="p-3 text-right">{period.revenues.length}</td><td className="p-3 text-right">{period.expenses.length}</td><td className="p-3 text-right font-semibold">{new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(period.expenses.reduce((sum,line)=>sum+line.amount,0))}</td></tr>)}</tbody></table>
        </div>
      </div>}

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4"><button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">Fechar</button><button onClick={confirmImport} disabled={!preview?.periods.length || importing || Boolean(status)} className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-40">{importing ? 'A importar…' : 'Confirmar importação'}</button></div>
    </div>
  </div>;
};
