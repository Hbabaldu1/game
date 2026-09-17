import React, { useEffect, useState } from 'react';
import { X, Share2, Download, Check, Copy } from 'lucide-react';
import { scoreCardGenerator, ScoreCardData } from '../utils/ScoreCardGenerator';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreData: ScoreCardData;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  scoreData
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Generate preview
    const canvas = scoreCardGenerator.generateScoreCard(scoreData);
    setPreviewUrl(canvas.toDataURL('image/png'));
  }, [isOpen, scoreData]);

  if (!isOpen) return null;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await scoreCardGenerator.shareScoreCard(scoreData);
    } catch (e) {
      console.error('Share failed', e);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = () => {
    scoreCardGenerator.downloadScoreCard(scoreData);
  };

  const handleCopyText = async () => {
    const text = `🚕 I scored ${scoreData.score.toLocaleString()} PTS in Danfo Drift: Lagos Express! Can you beat my high score? #DanfoDrift #LagosExpress`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-zinc-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">VIRAL TRIP TICKET</span>
            <h2 className="text-xl font-black text-white font-['Chakra_Petch']">SHARE YOUR RUN</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Graphic Preview */}
        <div className="my-4 w-full flex justify-center bg-black/40 p-2 rounded-xl border border-zinc-800">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Score Card Preview"
              className="w-full max-w-[280px] h-auto rounded-lg shadow-xl"
            />
          ) : (
            <div className="w-64 h-80 bg-zinc-800 animate-pulse rounded-lg flex items-center justify-center text-xs text-zinc-500">
              Generating Score Card...
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm font-['Chakra_Petch'] tracking-wide transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>SHARE TO SOCIAL / WHATSAPP</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SAVE IMAGE</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED!' : 'COPY TEXT'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
