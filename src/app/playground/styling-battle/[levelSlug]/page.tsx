'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getGameAndLevelDetails } from '@/lib/supabase/queries';
import { completeGameLevel } from '@/lib/supabase/actions';
import { Header } from '@/components/header';
import { CodeEditor } from '@/components/game/CodeEditor';
import { PreviewBox } from '@/components/game/PreviewBox';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, FastForward, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import Confetti from 'react-confetti';
import Link from 'next/link';

// Simple mapping for HTML based on the level slug
const getHtmlForLevel = (slug: string) => {
  if (slug === 'flex-space') {
    return `<div class="container">\n  <div class="box">1</div>\n  <div class="box">2</div>\n</div>`;
  }
  if (slug === 'grid-basics') {
    return `<div class="container">\n  <div class="box">1</div>\n  <div class="box">2</div>\n  <div class="box">3</div>\n</div>`;
  }
  if (slug === 'border-radius-circle') {
    return `<div class="container">\n  <div class="box"></div>\n</div>`;
  }
  if (slug === 'css-variables') {
    return `<div class="container">\n  <div class="box"></div>\n</div>`;
  }
  // Default for flex-center
  return `<div class="container">\n  <div class="box"></div>\n</div>`;
};

export default function StylingBattleLevelPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [level, setLevel] = useState<any>(null);
  const [game, setGame] = useState<any>(null);
  const [nextLevel, setNextLevel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [cssCode, setCssCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  
  const [isChecking, setIsChecking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirect=/playground/styling-battle/${params.levelSlug}`);
        return;
      }
      const { game, level, nextLevel } = await getGameAndLevelDetails('styling-battle', params.levelSlug as string);
      
      if (game && level) {
        setGame(game);
        setLevel(level);
        setNextLevel(nextLevel);
        setCssCode(level.starter_code || '');
        setHtmlCode(getHtmlForLevel(level.slug));
      }
      setLoading(false);
    };
    fetchDetails();
  }, [params.levelSlug, router, supabase]);

  const handleCheckSolution = async () => {
    if (!level) return;
    setIsChecking(true);
    setFeedbackMsg('');
    
    // Simulate a brief validation delay for dramatic effect
    await new Promise(r => setTimeout(r, 600));

    // Basic Validation: We expect multiple rules separated by ';;'
    const expectedRules = (level.expected_output || '').split(';;').map((r: string) => r.trim()).filter(Boolean);
    const userCssCleaned = cssCode.replace(/\s+/g, '').toLowerCase();

    // Check if the user CSS contains all the expected rules with whitespace stripped
    const isCorrect = expectedRules.every((rule: string) => {
      const cleanRule = rule.replace(/\s+/g, '').toLowerCase();
      // Handle missing trailing semicolon forgivingly
      const cleanRuleNoSemicolon = cleanRule.endsWith(';') ? cleanRule.slice(0, -1) : cleanRule;
      return userCssCleaned.includes(cleanRuleNoSemicolon);
    });

    if (isCorrect) {
      setIsSuccess(true);
      setFeedbackMsg(level.correct_feedback || 'Excellent work! You nailed it.');
      try {
        await completeGameLevel(level.id, game.id);
      } catch (e) {
        console.error('Failed to save progress', e);
      }
    } else {
      setFeedbackMsg(level.incorrect_feedback || 'Not quite right. Double check your CSS rules!');
    }
    
    setIsChecking(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <span className="ml-4 text-lg">Loading Arena...</span>
      </div>
    );
  }

  if (!level) return <div className="p-10 text-white">Level not found</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <Header />
      {isSuccess && <Confetti recycle={false} numberOfPieces={500} colors={['#3b82f6', '#8b5cf6', '#10b981']} />}
      
      {/* Game Navbar */}
      <div className="h-14 bg-slate-900 border-b border-white/10 flex items-center justify-between px-6 shrink-0 mt-16">
        <div className="flex items-center gap-4">
          <Link href="/playground/styling-battle" className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block leading-none mb-1">Styling Battle</span>
            <h1 className="text-sm font-bold text-white leading-none">{level.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {isSuccess && (
             <span className="text-green-400 font-bold flex items-center text-sm mr-4 tracking-wide animate-pulse">
               <CheckCircle className="w-4 h-4 mr-1"/> Level Cleared
             </span>
           )}
           <Button 
            onClick={handleCheckSolution} 
            disabled={isChecking || isSuccess}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide rounded-full px-6 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all"
          >
            {isChecking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Submit Code
          </Button>
        </div>
      </div>

      {/* Main 3-Column Game Area */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
        
        {/* Left Column: Instructions */}
        <div className="w-full lg:w-[350px] bg-slate-900/50 rounded-2xl border-2 border-slate-800 p-6 flex flex-col shadow-lg shrink-0 overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-2">{level.title}</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">{level.intro_text}</p>
          
          <div className="bg-slate-800/50 p-4 rounded-xl border border-blue-500/20 mb-6">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Objective</h3>
            <p className="text-sm text-slate-200">{level.objective}</p>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">HTML Structure (Fixed)</h3>
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{htmlCode}</pre>
          </div>

          {feedbackMsg && (
            <div className={\`p-4 rounded-xl border \${isSuccess ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}\`}>
              <p className={\`text-sm font-medium \${isSuccess ? 'text-green-400' : 'text-red-400'}\`}>{feedbackMsg}</p>
            </div>
          )}

          <div className="mt-auto pt-6 flex flex-col gap-3">
            {isSuccess && nextLevel && (
               <Link href={\`/playground/styling-battle/\${nextLevel.slug}\`} className="w-full">
                 <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    Next Level <FastForward className="w-4 h-4 ml-2" />
                 </Button>
               </Link>
            )}
             {isSuccess && !nextLevel && (
               <Link href="/playground/styling-battle" className="w-full">
                 <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]">
                    Return to Map
                 </Button>
               </Link>
            )}
          </div>
        </div>

        {/* Center Column: Live Preview */}
        <div className="flex-1 flex flex-col shadow-2xl">
           <PreviewBox htmlContent={htmlCode} cssContent={cssCode} />
        </div>

        {/* Right Column: Code Editor */}
        <div className="w-full lg:w-[450px] flex flex-col shadow-2xl shrink-0">
           <CodeEditor code={cssCode} onChange={setCssCode} disabled={isSuccess} />
        </div>

      </div>
    </div>
  );
}
