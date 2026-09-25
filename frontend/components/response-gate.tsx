'use client';

import React, { useState } from 'react';
import type { ResponsePlan, RecoveryVerificationResult } from '@/lib/types';
import { apiClient, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import {
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Lock,
  ArrowRight,
  RefreshCw,
  Cpu,
  FileCheck,
} from 'lucide-react';

interface ResponseGateProps {
  incidentId: string;
  responsePlan: ResponsePlan | null;
  onResponseUpdated?: () => void;
}

export function ResponseGate({
  incidentId,
  responsePlan,
  onResponseUpdated,
}: ResponseGateProps) {
  const [operatorName, setOperatorName] = useState('Operator-Alpha (Lead)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<RecoveryVerificationResult | null>(null);

  if (!responsePlan) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-mono text-sm">
        No active response plan found for incident {incidentId}.
      </div>
    );
  }

  const isApproved = responsePlan.approval_state === 'APPROVED';
  const isExecuted = responsePlan.execution_state === 'EXECUTED';
  const isRecovered = responsePlan.recovery_state === 'RECOVERED';

  const handleApproveAndExecute = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      // Must use backend-returned allowlisted action
      await apiClient.approveResponse(
        incidentId,
        responsePlan.recommended_action,
        operatorName
      );
      if (onResponseUpdated) {
        onResponseUpdated();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.detail || err.message);
      } else {
        setErrorMsg((err as Error).message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyRecovery = async () => {
    setErrorMsg(null);
    setIsVerifying(true);
    try {
      const res = await apiClient.verifyRecovery(incidentId);
      setVerificationResult(res);
      if (onResponseUpdated) {
        onResponseUpdated();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.detail || err.message);
      } else {
        setErrorMsg((err as Error).message);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Human Approval Warning Header */}
      <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-mono font-bold text-amber-900 uppercase tracking-wider">
            HUMAN APPROVAL REQUIRED · INDUSTRIAL SAFETY INTERLOCK
          </h4>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            AI copilot and autonomous algorithms cannot authorize or execute Modbus/TCP control commands. 
            An authenticated human operator must inspect the proposed register write and explicitly authorize remediation.
          </p>
        </div>
      </div>

      {/* Safety Workflow Chain */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-center text-xs font-mono">
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <span className="text-slate-400 block mb-1">01. OBSERVED</span>
          <span className="font-bold text-red-600">{responsePlan.current_value} {responsePlan.unit}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <span className="text-slate-400 block mb-1">02. PROPOSED</span>
          <span className="font-bold text-emerald-700">{responsePlan.target_value} {responsePlan.unit}</span>
        </div>
        <div className={`p-3 border rounded-lg ${isApproved ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
          <span className="block mb-1">03. APPROVAL</span>
          <span>{responsePlan.approval_state}</span>
        </div>
        <div className={`p-3 border rounded-lg ${isExecuted ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
          <span className="block mb-1">04. EXECUTION</span>
          <span>{responsePlan.execution_state}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <span className="text-slate-400 block mb-1">05. READBACK</span>
          <span className="font-bold text-slate-800">{responsePlan.verification_register}</span>
        </div>
        <div className={`p-3 border rounded-lg ${isRecovered ? 'bg-[#18875B] text-white font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
          <span className="block mb-1">06. RECOVERY</span>
          <span>{responsePlan.recovery_state}</span>
        </div>
      </div>

      {/* Primary Operator Response Console */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#1769FF]" />
            <h3 className="text-sm font-bold text-slate-900 font-mono">
              ALLOWLISTED RESPONSE PLAN EXECUTION GATE
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Target Asset: PLC-01 (Port 502)
          </span>
        </div>

        {/* Action Specification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="text-xs font-mono text-slate-500">PROPOSED MODBUS REMEDIATION WRITE</div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {responsePlan.recommended_action}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {responsePlan.description}
            </p>
            <div className="pt-2 border-t border-slate-200 text-xs font-mono grid grid-cols-2 gap-2 text-slate-600">
              <div>Register: <span className="font-bold text-slate-900">{responsePlan.register}</span></div>
              <div>Register Name: <span className="text-slate-900">{responsePlan.register_name}</span></div>
              <div>Current Value: <span className="font-bold text-red-600">{responsePlan.current_value} {responsePlan.unit}</span></div>
              <div>Target Value: <span className="font-bold text-[#18875B]">{responsePlan.target_value} {responsePlan.unit}</span></div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-slate-500 mb-2">VERIFICATION CRITERIA</div>
              <div className="text-xs font-mono text-slate-700 space-y-1.5">
                <div>Feedback Register: <span className="font-bold">{responsePlan.verification_register}</span></div>
                <div>Condition: <span className="font-bold text-slate-900">{responsePlan.verification_threshold}</span></div>
                <div>Requirement: Independent process sensor readback</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <label className="text-xs font-mono text-slate-500 block mb-1">
                OPERATOR IDENTIFIER / BADGE
              </label>
              <input
                type="text"
                value={operatorName}
                disabled={isApproved || isSubmitting}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1769FF]"
              />
            </div>
          </div>
        </div>

        {/* Error message callout */}
        {errorMsg && (
          <div className="p-3 mb-5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="text-xs font-mono text-slate-500">
            {isApproved ? (
              <span>Approved by: <strong className="text-slate-800">{responsePlan.approved_by}</strong> at {formatDate(responsePlan.approved_at ?? responsePlan.executed_at)}</span>
            ) : (
              <span>Awaiting explicit human operator authorization</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isApproved ? (
              <button
                onClick={handleApproveAndExecute}
                disabled={isSubmitting || !operatorName.trim()}
                className="px-5 py-2.5 rounded-lg bg-[#1769FF] hover:bg-[#1359dc] text-white text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    EXECUTING MODBUS WRITE...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    APPROVE & EXECUTE REMEDIATION
                  </>
                )}
              </button>
            ) : !isRecovered ? (
              <button
                onClick={handleVerifyRecovery}
                disabled={isVerifying}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    VERIFYING RECOVERY VIA READBACK...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    VERIFY RECOVERY VIA TELEMETRY
                  </>
                )}
              </button>
            ) : (
              <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#18875B]" />
                RECOVERY VERIFIED AND LOGGED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recovery Verification Receipt */}
      {verificationResult && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${verificationResult.recovered ? 'text-[#18875B]' : 'text-red-500'}`} />
              <h4 className="text-xs font-mono font-bold text-slate-900 uppercase">
                INDEPENDENT TELEMETRY READBACK VERIFICATION
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Verified at: {verificationResult.verified_at ? formatDate(verificationResult.verified_at) : 'Backend timestamp unavailable'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-4">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="text-slate-500 mb-1">CONTROL REGISTER READBACK ({(verificationResult.control_register ? 'R' + verificationResult.control_register : 'approved target register')})</div>
              <div className="flex items-center justify-between">
                <span>Expected: {verificationResult.target_value}</span>
                <span>Actual: <strong className="text-slate-900">{verificationResult.control_value}</strong></span>
                <span className={(Math.abs((verificationResult.control_value ?? 0) - (verificationResult.target_value ?? 0)) <= 0.000001) ? 'text-[#18875B] font-bold' : 'text-red-600 font-bold'}>
                  {Math.abs((verificationResult.control_value ?? 0) - (verificationResult.target_value ?? 0)) <= 0.000001 ? 'MATCH' : 'MISMATCH'}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="text-slate-500 mb-1">PROCESS FEEDBACK ({(verificationResult.process_register != null ? 'R' + verificationResult.process_register : 'N/A')})</div>
              <div className="flex items-center justify-between">
                <span>Safe Bound: {verificationResult.verification_threshold ?? 'Backend-defined criterion'}</span>
                <span>Measured: <strong className="text-slate-900">{verificationResult.process_value ?? 'N/A'} {''}</strong></span>
                <span className={verificationResult.recovered ? 'text-[#18875B] font-bold' : 'text-red-600 font-bold'}>
                  {verificationResult.recovered ? 'RECOVERY VERIFIED' : 'OUT OF BOUNDS'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 leading-relaxed font-sans">
            {(verificationResult.recovered ? 'Recovery verified by backend control readback and process verification.' : 'Recovery not yet verified. Backend reports the process remains outside the recovery criterion.')}
          </div>
        </div>
      )}
    </div>
  );
}
