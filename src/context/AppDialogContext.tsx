import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type DialogTone = 'danger' | 'success' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
}

interface NoticeOptions {
  title?: string;
  message: string;
  tone?: DialogTone;
}

interface AppDialogContextValue {
  showAlert: (message: string, title?: string) => void;
  showNotice: (options: NoticeOptions) => void;
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
}

type ActiveDialog =
  | ({ kind: 'notice' } & Required<NoticeOptions>)
  | ({ kind: 'confirm' } & Required<ConfirmOptions>);

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

const toneStyles = {
  danger: {
    header: 'border-rose-100 bg-rose-50',
    icon: 'bg-rose-100 text-rose-700',
    button: 'bg-rose-600 hover:bg-rose-700',
    Icon: XCircle
  },
  success: {
    header: 'border-emerald-100 bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    Icon: CheckCircle2
  },
  info: {
    header: 'border-blue-100 bg-blue-50',
    icon: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    Icon: Info
  }
};

export const AppDialogProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);
  const confirmResolver = useRef<((result: boolean) => void) | null>(null);

  const closeDialog = useCallback((result = false) => {
    confirmResolver.current?.(result);
    confirmResolver.current = null;
    setDialog(null);
  }, []);

  const showNotice = useCallback((options: NoticeOptions) => {
    setDialog({
      kind: 'notice',
      title: options.title || (options.tone === 'success' ? 'Operação concluída' : options.tone === 'danger' ? 'Não foi possível concluir' : 'Informação'),
      message: options.message,
      tone: options.tone || 'info'
    });
  }, []);

  const showAlert = useCallback((message: string, title?: string) => {
    const isError = /^erro\b/i.test(message);
    const isSuccess = /sucesso/i.test(message);
    showNotice({
      title,
      message,
      tone: isError ? 'danger' : isSuccess ? 'success' : 'info'
    });
  }, [showNotice]);

  const confirmAction = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    confirmResolver.current = resolve;
    setDialog({
      kind: 'confirm',
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel || 'Confirmar',
      cancelLabel: options.cancelLabel || 'Cancelar',
      tone: options.tone || 'danger'
    });
  }), []);

  const styles = dialog ? toneStyles[dialog.tone] : toneStyles.info;
  const DialogIcon = dialog?.tone === 'danger' && dialog.kind === 'confirm' ? AlertTriangle : styles.Icon;

  return (
    <AppDialogContext.Provider value={{ showAlert, showNotice, confirmAction }}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-dialog-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className={`flex items-start gap-3 border-b px-5 py-4 ${styles.header}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.icon}`}>
                <DialogIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 id="app-dialog-title" className="text-base font-black text-slate-900">{dialog.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm leading-5 text-slate-600">{dialog.message}</p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              {dialog.kind === 'confirm' && (
                <button type="button" onClick={() => closeDialog(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100">
                  {dialog.cancelLabel}
                </button>
              )}
              <button type="button" autoFocus onClick={() => closeDialog(true)} className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white transition ${styles.button}`}>
                {dialog.kind === 'confirm' ? dialog.confirmLabel : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppDialogContext.Provider>
  );
};

export const useAppDialog = () => {
  const context = useContext(AppDialogContext);
  if (!context) throw new Error('useAppDialog deve ser usado dentro de AppDialogProvider');
  return context;
};
