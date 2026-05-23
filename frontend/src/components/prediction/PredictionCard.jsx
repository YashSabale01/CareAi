import { riskColor, riskBg, formatConfidence, formatDateTime } from '../../utils/formatters';
import { DISCLAIMER } from '../../utils/constants';

const DISEASE_DESCRIPTIONS = {
  'Arrhythmia':        'Irregular heartbeat pattern detected from vitals.',
  'Asthma':            'Respiratory distress indicators present in vitals.',
  'Diabetes Mellitus': 'Metabolic indicators suggest possible diabetes.',
  'Hypertension':      'Elevated blood pressure pattern detected.',
  'Normal':            'Vitals pattern shows no significant condition.',
};

const RISK_DESCRIPTIONS = {
  High:   'Immediate medical attention recommended. Vitals or condition indicate serious risk.',
  Medium: 'Condition requires monitoring and timely follow-up with the doctor.',
  Low:    'Patient appears stable. Continue routine monitoring.',
};

const ALERT_ICONS   = { Normal: '✅', High: '🔴', Low: '🟡', Abnormal: '🟠' };
const ALERT_COLORS  = { Normal: '#22c55e', High: '#ef4444', Low: '#f59e0b', Abnormal: '#f59e0b' };

export function RiskBadge({ level }) {
  return (
    <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ color: riskColor(level), background: riskBg(level) }}>
      {level} Risk
    </span>
  );
}

export default function PredictionCard({ prediction }) {
  if (!prediction) return null;
  const { predictedDisease, riskLevel, confidence, confidenceLabel, classProbabilities, alerts, shapValues, modelUsed, createdAt } = prediction;

  const isNormal = predictedDisease === 'Normal';

  return (
    <div className="card flex flex-col gap-5">

      {/* Header — condition + risk */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[#94a3b8] mb-1">{isNormal ? 'Health Status' : 'Predicted Condition'}</p>
          <h3 className="text-xl font-bold" style={{ color: isNormal ? '#22c55e' : '#f1f5f9' }}>
            {isNormal ? '✓ No Condition Detected' : predictedDisease}
          </h3>
          <p className="text-xs text-[#94a3b8] mt-1">{DISEASE_DESCRIPTIONS[predictedDisease] || ''}</p>
        </div>
        <RiskBadge level={riskLevel} />
      </div>

      {/* Risk level explanation */}
      <div className="p-3 rounded-lg border" style={{ borderColor: riskColor(riskLevel) + '44', background: riskColor(riskLevel) + '11' }}>
        <p className="text-xs font-semibold mb-0.5" style={{ color: riskColor(riskLevel) }}>
          {riskLevel} Risk — What does this mean?
        </p>
        <p className="text-xs text-[#94a3b8]">{RISK_DESCRIPTIONS[riskLevel]}</p>
      </div>

      {/* Confidence */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <div>
            <span className="text-[#94a3b8]">Model Confidence </span>
            <span className="text-[#f1f5f9] font-semibold">{formatConfidence(confidence)}</span>
          </div>
          <span className="text-[#94a3b8] italic">{confidenceLabel || ''}</span>
        </div>
        <div className="h-2 rounded-full bg-[#2d3748]">
          <div className="h-2 rounded-full transition-all" style={{ width: `${confidence * 100}%`, background: riskColor(riskLevel) }} />
        </div>
        <p className="text-xs text-[#94a3b8] mt-1.5">
          Confidence = how closely this patient's vitals match the predicted condition pattern.
          It is <span className="text-[#f1f5f9]">not</span> a probability of having the disease — always confirm with clinical assessment.
        </p>
      </div>

      {/* Vital alerts */}
      {alerts && (
        <div>
          <p className="text-xs font-semibold text-[#94a3b8] mb-2">VITAL ALERTS</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Heart Rate', alerts.heartRate],
              ['SpO2 (Oxygen)', alerts.spo2],
              ['Blood Pressure', alerts.bloodPressure],
              ['Temperature', alerts.temperature],
            ].map(([label, status]) => (
              <div key={label} className="flex items-center gap-2 p-2 rounded border border-[#2d3748] text-xs">
                <span>{ALERT_ICONS[status] || '⚪'}</span>
                <div>
                  <p className="text-[#94a3b8]">{label}</p>
                  <p className="font-semibold" style={{ color: ALERT_COLORS[status] || '#94a3b8' }}>{status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Condition probabilities */}
      {classProbabilities && (
        <div>
          <p className="text-xs font-semibold text-[#94a3b8] mb-1">CONDITION MATCH SCORES</p>
          <p className="text-xs text-[#94a3b8] mb-2">How closely vitals match each condition pattern:</p>
          <div className="flex flex-col gap-1.5">
            {Object.entries(classProbabilities).sort((a, b) => b[1] - a[1]).map(([cls, prob]) => (
              <div key={cls} className="flex items-center gap-2">
                <span className="text-xs text-[#94a3b8] w-36 truncate">{cls === 'Normal' ? 'No Condition' : cls}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[#2d3748]">
                  <div className="h-1.5 rounded-full" style={{ width: `${prob * 100}%`, background: cls === predictedDisease ? riskColor(riskLevel) : '#6366f1' }} />
                </div>
                <span className="text-xs text-[#94a3b8] w-10 text-right">{formatConfidence(prob)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHAP — top influential factors */}
      {shapValues && Object.keys(shapValues).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#94a3b8] mb-1">KEY FACTORS DRIVING THIS PREDICTION</p>
          <p className="text-xs text-[#94a3b8] mb-2">Positive = pushed toward this condition · Negative = pushed away</p>
          {Object.entries(shapValues).map(([feat, val]) => (
            <div key={feat} className="flex justify-between items-center text-xs py-1 border-b border-[#2d3748]">
              <span className="text-[#f1f5f9]">{feat}</span>
              <span className="font-semibold" style={{ color: val > 0 ? '#ef4444' : '#22c55e' }}>
                {val > 0 ? '▲' : '▼'} {Math.abs(val)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-[#94a3b8] pt-2 border-t border-[#2d3748]">
        <span>Model: {modelUsed}</span>
        {createdAt && <span>{formatDateTime(createdAt)}</span>}
      </div>

      <p className="text-xs text-[#94a3b8] italic border-t border-[#2d3748] pt-2">{DISCLAIMER}</p>
    </div>
  );
}
