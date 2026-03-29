import { Loader2, ClipboardList, Settings, Cross } from 'lucide-react';
import { BottomSheet } from '../BottomSheet';
import { TimePicker } from '../TimePicker';
import { ErrorCard } from '../ui/ErrorCard';
import { EVENT_TYPES, type ScheduleLayer, type EventType } from '../../lib/schedule-events';
import { fmtDisplay, fmtHourLabel, DURATIONS, PRIORITIES } from './utils';

interface ScheduleEventFormProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date;
  addingAtHour: number | null;
  use24h: boolean;
  // Form state
  title: string;
  setTitle: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  duration: number;
  setDuration: (v: number) => void;
  category: string;
  setCategory: (v: string) => void;
  eventType: EventType;
  setEventType: (v: EventType) => void;
  formLayer: ScheduleLayer;
  setFormLayer: (v: ScheduleLayer) => void;
  desc: string;
  setDesc: (v: string) => void;
  allDay: boolean;
  setAllDay: (v: boolean) => void;
  eventPriority: string;
  setEventPriority: (v: string) => void;
  // Goal linking
  eventObjective: string;
  setEventObjective: (v: string) => void;
  eventEpic: string;
  setEventEpic: (v: string) => void;
  eventGoal: string;
  setEventGoal: (v: string) => void;
  objectives: Array<{ id: string; title: string }>;
  epics: Array<{ id: string; title: string }>;
  linkableGoals: Array<{ id: string; title: string }>;
  // Actions
  saving: boolean;
  error: string;
  onCreateEvent: () => void;
}

export function ScheduleEventForm({
  open,
  onClose,
  selectedDate,
  addingAtHour,
  use24h,
  title, setTitle,
  time, setTime,
  duration, setDuration,
  category, setCategory,
  eventType, setEventType,
  formLayer, setFormLayer,
  desc, setDesc,
  allDay, setAllDay,
  eventPriority, setEventPriority,
  eventObjective, setEventObjective,
  eventEpic, setEventEpic,
  eventGoal, setEventGoal,
  objectives, epics, linkableGoals,
  saving, error, onCreateEvent,
}: ScheduleEventFormProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="New Event">
      <div className="sched-form-date-label">
        {fmtDisplay(selectedDate)}
        {addingAtHour !== null && <span> at {fmtHourLabel(addingAtHour, use24h)}</span>}
      </div>
      <input autoFocus className="sched-form-input" placeholder="Event title..." value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onCreateEvent()} />
      
      <div className="sched-form-row">
        <div className="sched-form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
            All day event
          </label>
        </div>
      </div>

      {!allDay && (
        <div className="sched-form-row">
          <div className="sched-form-group">
            <TimePicker value={time} onChange={setTime} label="Start Time" />
          </div>
          <div className="sched-form-group">
            <label>Duration</label>
            <div className="sched-dur-pills">
              {DURATIONS.map(d => (
                <button key={d} className={`sched-dur-pill ${duration === d ? 'active' : ''}`} onClick={() => setDuration(d)}>
                  {d < 60 ? `${d}m` : d === 60 ? '1h' : `${d / 60}h`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Layer tabs */}
      <div className="sched-form-row">
        <div className="sched-form-group">
          <label>Schedule Layer</label>
          <div className="sched-layer-tabs">
            {(['primary', 'operations', 'sacred'] as ScheduleLayer[]).map(layer => (
              <button
                key={layer}
                className={`sched-layer-tab ${formLayer === layer ? 'active' : ''} sched-layer-tab--${layer}`}
                onClick={() => {
                  setFormLayer(layer);
                  const layerTypes = EVENT_TYPES.filter(t => t.layer === layer);
                  if (layerTypes.length > 0) {
                    setEventType(layerTypes[0].id);
                    setCategory(layer === 'primary' ? layerTypes[0].id : 'general');
                  }
                }}
              >
                {layer === 'primary' ? <><ClipboardList size={12} /> Primary</> : layer === 'operations' ? <><Settings size={12} /> Operations</> : <><Cross size={12} /> Sacred</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event type selector */}
      <div className="sched-form-row">
        <div className="sched-form-group">
          <label>Event Type</label>
          <div className="sched-cat-pills">
            {EVENT_TYPES.filter(t => t.layer === formLayer).map(t => (
              <button
                key={t.id}
                className={`sched-cat-pill ${eventType === t.id ? 'active' : ''}`}
                style={{ '--cat-color': t.color } as React.CSSProperties}
                onClick={() => { setEventType(t.id); setCategory(t.id); }}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sched-form-row">
        <div className="sched-form-group">
          <label>Priority</label>
          <div className="sched-cat-pills">
            {PRIORITIES.map(p => (
              <button key={p.id} className={`sched-cat-pill ${eventPriority === p.id ? 'active' : ''}`} style={{ '--cat-color': p.color } as React.CSSProperties} onClick={() => setEventPriority(p.id)}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="sched-form-row">
        <div className="sched-form-group">
          <label>Link to Goal (optional)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select className="sched-form-select" value={eventObjective} onChange={e => { setEventObjective(e.target.value); setEventEpic(''); setEventGoal(''); }}>
              <option value="">Select Objective</option>
              {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
            {eventObjective && (
              <select className="sched-form-select" value={eventEpic} onChange={e => { setEventEpic(e.target.value); setEventGoal(''); }}>
                <option value="">Select Epic</option>
                {epics.map(ep => <option key={ep.id} value={ep.id}>{ep.title}</option>)}
              </select>
            )}
            {eventEpic && (
              <select className="sched-form-select" value={eventGoal} onChange={e => setEventGoal(e.target.value)}>
                <option value="">Select Goal</option>
                {linkableGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <input className="sched-form-input small" placeholder="Notes (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
      {error && <ErrorCard message={error} />}
      <div className="sched-form-actions">
        <button className="sched-form-cancel" onClick={onClose}>Cancel</button>
        <button className="sched-form-save" onClick={onCreateEvent} disabled={saving || !title.trim()}>
          {saving ? <><Loader2 size={14} className="spin" /> Saving...</> : 'Create Event'}
        </button>
      </div>
    </BottomSheet>
  );
}
