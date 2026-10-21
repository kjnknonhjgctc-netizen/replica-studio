import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from '@/delux/router';
import { Globe, Download, X, Share, CheckCircle2, Info, Smartphone } from 'lucide-react';
import { DeluxLogo } from '../../components/common/DeluxLogo';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { detectPlatform, installState, isStandalone, type Platform } from '../../install/installPrompt';

type Sheet = null | 'confirm' | 'ios' | 'unavailable' | 'done';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    const sync = () => {
      setCanPrompt(installState.canPrompt());
      setInstalled(installState.isInstalled() || isStandalone());
    };
    sync();
    return installState.subscribe(sync);
  }, []);

  const goBrowser = () => navigate('/cadastro');

  const onDownload = () => {
    if (installed) return goBrowser();
    if (platform === 'ios') return setSheet('ios');
    setSheet(canPrompt ? 'confirm' : 'unavailable');
  };

  const confirmInstall = async () => {
    setBusy(true);
    const outcome = await installState.prompt();
    setBusy(false);
    if (outcome === 'accepted') setSheet('done');
    else if (outcome === 'unavailable') setSheet('unavailable');
    else setSheet(null);
  };

  const openIosShare = async () => {
    setShareFailed(false);
    try {
      await navigator.share({ title: 'Delux', url: window.location.origin + '/app/inicio' });
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') setShareFailed(true);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F7F8FA] dark:bg-[#0B0E14] flex flex-col items-center justify-center px-5 py-10 transition-colors relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><DeluxLogo /></div>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17191D] dark:text-white">
            Como você quer usar o Delux?
          </h1>
          <p className="mt-2 text-sm text-[#777D87] dark:text-slate-400">
            Sua conta e seu progresso são os mesmos nas duas opções.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={goBrowser}
            className="group w-full flex items-center gap-4 p-5 rounded-2xl text-left text-white bg-gradient-to-r from-[#7033FF] to-[#356AE6] shadow-lg shadow-[#356AE6]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">Continuar no navegador</span>
              <span className="block text-xs text-white/80 mt-0.5">Crie sua conta agora, sem instalar nada</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onDownload}
            className="group w-full flex items-center gap-4 p-5 rounded-2xl text-left bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 hover:border-[#356AE6]/50 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <span className="w-11 h-11 rounded-xl bg-[#356AE6]/10 text-[#356AE6] flex items-center justify-center shrink-0">
              {installed ? <CheckCircle2 className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-[#17191D] dark:text-white">
                {installed ? 'App já instalado' : 'Baixar o aplicativo'}
              </span>
              <span className="block text-xs text-[#777D87] dark:text-slate-400 mt-0.5">
                {installed
                  ? 'Continue para criar sua conta'
                  : platform === 'ios'
                    ? 'Adicione o Delux à tela de início do iPhone'
                    : 'Ícone na tela inicial e abertura em tela cheia'}
              </span>
            </span>
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-[#777D87] dark:text-slate-400">
          Já tem conta?{' '}
          <Link to="/login" className="font-semibold text-[#356AE6] hover:underline">Fazer login</Link>
        </p>
      </div>

      {sheet && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => !busy && setSheet(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="w-12 h-12 rounded-2xl overflow-hidden shadow">
                <img src="/icon-192.png" alt="" width={48} height={48} />
              </span>
              <button aria-label="Fechar" onClick={() => setSheet(null)} className="p-1.5 rounded-lg text-[#777D87] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sheet === 'confirm' && (
              <>
                <h2 className="text-lg font-bold text-[#17191D] dark:text-white">Instalar o Delux?</h2>
                <p className="mt-2 text-sm text-[#777D87] dark:text-slate-400">
                  O Delux será adicionado ao seu aparelho com ícone próprio e abrirá em tela cheia. Ocupa pouco espaço e você pode remover quando quiser.
                </p>
                <div className="mt-6 flex gap-2">
                  <button onClick={() => setSheet(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[#E4E7EC] dark:border-slate-700 text-[#17191D] dark:text-white cursor-pointer">Agora não</button>
                  <button onClick={confirmInstall} disabled={busy} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7033FF] to-[#356AE6] disabled:opacity-60 cursor-pointer">
                    {busy ? 'Aguarde…' : 'Sim, instalar'}
                  </button>
                </div>
              </>
            )}

            {sheet === 'done' && (
              <>
                <h2 className="text-lg font-bold text-[#17191D] dark:text-white">Pronto!</h2>
                <p className="mt-2 text-sm text-[#777D87] dark:text-slate-400">O Delux está sendo instalado. Você pode abrir pelo ícone ou continuar aqui.</p>
                <button onClick={goBrowser} className="mt-6 w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7033FF] to-[#356AE6] cursor-pointer">Criar minha conta</button>
              </>
            )}

            {sheet === 'ios' && (
              <>
                <h2 className="text-lg font-bold text-[#17191D] dark:text-white">Delux no iPhone</h2>
                <p className="mt-2 text-sm text-[#777D87] dark:text-slate-400">
                  A Apple não permite que sites instalem apps automaticamente, e o Delux ainda não está na App Store. O caminho oficial do iPhone é adicionar o Delux à tela de início — ele abre em tela cheia, como um app.
                </p>
                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-[#356AE6]/8 text-xs text-[#17191D] dark:text-slate-200">
                  <Smartphone className="w-4 h-4 text-[#356AE6] shrink-0 mt-0.5" />
                  <span>Toque no botão abaixo e escolha <strong>“Adicionar à Tela de Início”</strong> na janela do iPhone.</span>
                </div>
                {shareFailed && (
                  <p className="mt-3 text-xs text-rose-600">Não foi possível abrir a janela de compartilhamento neste navegador. Abra o Delux no Safari para adicionar à tela de início.</p>
                )}
                <div className="mt-6 flex gap-2">
                  <button onClick={goBrowser} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[#E4E7EC] dark:border-slate-700 text-[#17191D] dark:text-white cursor-pointer">Usar no navegador</button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button onClick={openIosShare} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7033FF] to-[#356AE6] inline-flex items-center justify-center gap-1.5 cursor-pointer">
                      <Share className="w-4 h-4" /> Adicionar
                    </button>
                  )}
                </div>
              </>
            )}

            {sheet === 'unavailable' && (
              <>
                <h2 className="text-lg font-bold text-[#17191D] dark:text-white">Instalação indisponível aqui</h2>
                <p className="mt-2 text-sm text-[#777D87] dark:text-slate-400">
                  Este navegador não ofereceu a instalação do Delux agora. Isso acontece em navegadores sem suporte (como alguns embutidos em redes sociais), na pré-visualização do editor, ou se o app já estiver instalado.
                </p>
                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-[#356AE6]/8 text-xs text-[#17191D] dark:text-slate-200">
                  <Info className="w-4 h-4 text-[#356AE6] shrink-0 mt-0.5" />
                  <span>No Android, abra o site publicado no Chrome para instalar com um toque.</span>
                </div>
                <button onClick={goBrowser} className="mt-6 w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7033FF] to-[#356AE6] cursor-pointer">Continuar no navegador</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
