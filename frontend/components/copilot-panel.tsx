'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CopilotBriefResponse, CopilotChatResponse } from '@/lib/types';
import { apiClient } from '@/lib/api';
import { Bot, Send, ShieldAlert, Sparkles, RefreshCw, AlertCircle, Info } from 'lucide-react';

interface CopilotPanelProps {
  incidentId: string;
}

export function CopilotPanel({ incidentId }: CopilotPanelProps) {
  const [brief, setBrief] = useState<CopilotBriefResponse | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<CopilotChatResponse[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const loadBrief = useCallback(async () => {
    if (!incidentId) return;
    setLoadingBrief(true);
    setBriefError(null);
    try {
      const res = await apiClient.generateCopilotBrief(incidentId);
      setBrief(res);
    } catch (err: unknown) {
      setBriefError((err as Error).message);
    } finally {
      setLoadingBrief(false);
    }
  }, [incidentId]);

  useEffect(() => {
    loadBrief();
  }, [loadBrief]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    setIsAsking(true);
    setChatError(null);
    try {
      const res = await apiClient.askCopilot(incidentId, question.trim());
      setChatHistory((prev) => [...prev, res]);
      setQuestion('');
    } catch (err: unknown) {
      setChatError((err as Error).message);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Strict Boundary Disclosure Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-sm flex items-start gap-3">
        <Bot className="w-5 h-5 text-[#1769FF] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-mono font-bold text-slate-100 flex items-center gap-2">
            <span>EVIDENCE-GROUNDED COPILOT</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">READ-ONLY INTELLIGENCE LAYER</span>
          </div>
          <p className="text-slate-400 leading-relaxed font-sans">
            PermiSense Copilot interprets and explains verified telemetry and correlation evidence.
            AI <strong>cannot</strong> create evidence, alter severity/risk scores, approve remediation, or execute Modbus/TCP commands.
          </p>
        </div>
      </div>

      {/* Incident Analytical Brief */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1769FF]" />
            <h3 className="text-sm font-semibold text-slate-900 font-mono">
              EVIDENCE-GROUNDED INCIDENT BRIEF ({incidentId})
            </h3>
          </div>
          <button
            onClick={loadBrief}
            disabled={loadingBrief}
            className="flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingBrief ? 'animate-spin' : ''}`} />
            Refresh Brief
          </button>
        </div>

        {loadingBrief ? (
          <div className="py-8 text-center text-xs font-mono text-slate-500">
            SYNTHESIZING EVIDENCE BRIEF VIA GEMINI 2.5 FLASH...
          </div>
        ) : briefError ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{briefError}</span>
          </div>
        ) : brief ? (
          <div className="space-y-4 text-xs">
            {/* Summary */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                SUMMARY
              </span>
              <p className="text-slate-800 leading-relaxed font-sans">{brief.summary}</p>
            </div>

            {/* Evidence Breakdown */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1.5">
                EVIDENCE BREAKDOWN
              </span>
              <ul className="space-y-1.5 font-mono text-slate-700">
                {brief.evidence_breakdown.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#1769FF] font-bold">›</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Operational Impact */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                OPERATIONAL IMPACT
              </span>
              <p className="text-slate-800 leading-relaxed font-sans">{brief.operational_impact}</p>
            </div>

            {/* Recommended Action */}
            <div className="p-3.5 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <span className="text-[10px] font-mono font-bold text-amber-900 uppercase block mb-1">
                RECOMMENDED ACTION (HUMAN APPROVAL REQUIRED)
              </span>
              <p className="text-amber-900 leading-relaxed font-sans font-medium">{brief.recommended_action}</p>
            </div>

            {/* Confidence & Limitations */}
            <div className="p-3 bg-slate-100/70 rounded-lg text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Confidence & Limitations: </strong>
                {brief.confidence_and_limitations}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Grounded Interactive Q&A */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-900 font-mono">
            OPERATOR Q&A (EVIDENCE-GROUNDED)
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Strict Fact Grounding
          </span>
        </div>

        {/* Chat History */}
        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 font-mono">
              Ask any question about this incident (e.g. &ldquo;Which register was altered?&rdquo;, &ldquo;What was the peak observed speed?&rdquo;)
            </div>
          ) : (
            chatHistory.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                <div className="font-semibold text-xs text-slate-900">
                  Q: &ldquo;{item.question}&rdquo;
                </div>

                <div className="text-xs text-slate-800 leading-relaxed font-sans pl-3 border-l-2 border-[#1769FF]">
                  <strong className="text-slate-900 block font-mono text-[11px] mb-0.5">ANSWER:</strong>
                  {item.answer}
                </div>

                {item.evidence_used && item.evidence_used.length > 0 && (
                  <div className="text-[11px] font-mono text-slate-600 pl-3">
                    <span className="text-slate-400 block mb-0.5">EVIDENCE USED:</span>
                    {item.evidence_used.map((ev, i) => (
                      <div key={i} className="text-slate-700">· {ev}</div>
                    ))}
                  </div>
                )}

                <div className="p-2.5 bg-amber-500/10 rounded text-[11px] text-amber-900 font-sans">
                  <strong>Action Advisory: </strong>{item.action_advisory}
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  Limitation: {item.limitations}
                </div>
              </div>
            ))
          )}
        </div>

        {chatError && (
          <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {chatError}
          </div>
        )}

        {/* Input Field */}
        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask copilot about the recorded evidence or impact..."
            disabled={isAsking}
            className="flex-1 text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769FF] text-slate-900"
          />
          <button
            type="submit"
            disabled={isAsking || !question.trim()}
            className="px-4 py-2.5 bg-[#1769FF] hover:bg-[#1359dc] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isAsking ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
