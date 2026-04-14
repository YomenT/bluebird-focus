import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/NotificationSettings.css';

const REMIND_OPTIONS = [
    { value: 0, label: 'On the day' },
    { value: 1, label: '1 day before' },
    { value: 2, label: '2 days before' },
    { value: 3, label: '3 days before' },
    { value: 7, label: '1 week before' },
];

const EMPTY_FORM = { title: '', deadline: '', remind_days_before: 1 };

function NotificationSettings({ onBack }) {
    const { apiCall } = useAuth();

    const [settings, setSettings] = useState({
        weekly_report: false,
        inactivity_alert: false,
        reminder_emails: false,
    });
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingToggle, setSavingToggle] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formSaving, setFormSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [settingsRes, remindersRes] = await Promise.all([
                apiCall('/focus/email-settings/'),
                apiCall('/focus/reminders/'),
            ]);
            if (settingsRes.ok) setSettings(await settingsRes.json());
            if (remindersRes.ok) setReminders(await remindersRes.json());
        } catch (err) {
            console.error('Failed to load notification settings:', err);
        }
        setLoading(false);
    }, [apiCall]);

    useEffect(() => { load(); }, [load]);

    const handleToggle = async (key) => {
        const newValue = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newValue }));
        setSavingToggle(key);
        try {
            const res = await apiCall('/focus/email-settings/', {
                method: 'PATCH',
                body: JSON.stringify({ [key]: newValue }),
            });
            if (!res.ok) {
                // Revert on failure
                setSettings(prev => ({ ...prev, [key]: !newValue }));
            }
        } catch {
            setSettings(prev => ({ ...prev, [key]: !newValue }));
        }
        setSavingToggle(null);
    };

    const handleAddReminder = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { setFormError('Title is required.'); return; }
        if (!form.deadline) { setFormError('Deadline date is required.'); return; }
        setFormError('');
        setFormSaving(true);
        try {
            const res = await apiCall('/focus/reminders/create/', {
                method: 'POST',
                body: JSON.stringify({
                    title: form.title.trim(),
                    deadline: form.deadline,
                    remind_days_before: form.remind_days_before,
                }),
            });
            if (res.ok) {
                const created = await res.json();
                setReminders(prev => [...prev, created].sort((a, b) => a.deadline.localeCompare(b.deadline)));
                setForm(EMPTY_FORM);
                setShowAddForm(false);
            } else {
                setFormError('Failed to save reminder. Please try again.');
            }
        } catch {
            setFormError('Failed to save reminder. Please try again.');
        }
        setFormSaving(false);
    };

    const handleToggleComplete = async (reminder) => {
        const newCompleted = !reminder.is_completed;
        setReminders(prev =>
            prev.map(r => r.id === reminder.id ? { ...r, is_completed: newCompleted } : r)
        );
        try {
            const res = await apiCall(`/focus/reminders/${reminder.id}/update/`, {
                method: 'PATCH',
                body: JSON.stringify({ is_completed: newCompleted }),
            });
            if (!res.ok) {
                setReminders(prev =>
                    prev.map(r => r.id === reminder.id ? { ...r, is_completed: !newCompleted } : r)
                );
            }
        } catch {
            setReminders(prev =>
                prev.map(r => r.id === reminder.id ? { ...r, is_completed: !newCompleted } : r)
            );
        }
    };

    const handleDeleteReminder = async (id) => {
        setReminders(prev => prev.filter(r => r.id !== id));
        try {
            await apiCall(`/focus/reminders/${id}/delete/`, { method: 'DELETE' });
        } catch {
            // Best-effort; reload if needed
            load();
        }
    };

    const formatDeadline = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isOverdue = (dateStr) => new Date(dateStr + 'T00:00:00') < new Date(new Date().toDateString());

    if (loading) {
        return (
            <div className="notif-settings notif-settings--loading">
                <div className="notif-settings__loading-pulse" />
                <p className="notif-settings__loading-text">Loading settings…</p>
            </div>
        );
    }

    const activeReminders = reminders.filter(r => !r.is_completed);
    const completedReminders = reminders.filter(r => r.is_completed);

    return (
        <div className="notif-settings">
            <div className="notif-settings__header">
                <button className="notif-settings__back" onClick={onBack}>←</button>
                <h2 className="notif-settings__title">Notifications</h2>
            </div>

            {/* Email toggles */}
            <section className="notif-settings__section">
                <p className="notif-settings__section-label">Email notifications</p>
                <p className="notif-settings__section-hint">
                    Sent to the address associated with your account. All off by default.
                </p>

                <div className="notif-settings__toggles">
                    <ToggleRow
                        label="Weekly focus report"
                        description="A summary of your sessions sent every Monday."
                        checked={settings.weekly_report}
                        disabled={savingToggle === 'weekly_report'}
                        onChange={() => handleToggle('weekly_report')}
                    />
                    <ToggleRow
                        label="Inactivity reminder"
                        description="A gentle nudge if you haven't focused in 5 days."
                        checked={settings.inactivity_alert}
                        disabled={savingToggle === 'inactivity_alert'}
                        onChange={() => handleToggle('inactivity_alert')}
                    />
                    <ToggleRow
                        label="Deadline reminders"
                        description="Email alerts for the reminders you set below."
                        checked={settings.reminder_emails}
                        disabled={savingToggle === 'reminder_emails'}
                        onChange={() => handleToggle('reminder_emails')}
                    />
                </div>
            </section>

            {/* Reminders */}
            <section className="notif-settings__section">
                <div className="notif-settings__reminders-header">
                    <p className="notif-settings__section-label">Reminders</p>
                    {!showAddForm && (
                        <button
                            className="notif-settings__add-btn"
                            onClick={() => { setShowAddForm(true); setFormError(''); }}
                        >
                            + Add
                        </button>
                    )}
                </div>

                {showAddForm && (
                    <form className="notif-settings__add-form" onSubmit={handleAddReminder}>
                        <input
                            className="notif-settings__input"
                            type="text"
                            placeholder="What are you working toward?"
                            value={form.title}
                            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                            maxLength={200}
                            autoFocus
                        />
                        <div className="notif-settings__form-row">
                            <div className="notif-settings__field">
                                <label className="notif-settings__field-label">Deadline</label>
                                <input
                                    className="notif-settings__input notif-settings__input--date"
                                    type="date"
                                    value={form.deadline}
                                    onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                                />
                            </div>
                            <div className="notif-settings__field">
                                <label className="notif-settings__field-label">Remind me</label>
                                <select
                                    className="notif-settings__select"
                                    value={form.remind_days_before}
                                    onChange={e => setForm(p => ({ ...p, remind_days_before: parseInt(e.target.value) }))}
                                >
                                    {REMIND_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {formError && <p className="notif-settings__form-error">{formError}</p>}
                        <div className="notif-settings__form-actions">
                            <button
                                type="button"
                                className="notif-settings__cancel-btn"
                                onClick={() => { setShowAddForm(false); setForm(EMPTY_FORM); setFormError(''); }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="notif-settings__save-btn"
                                disabled={formSaving}
                            >
                                {formSaving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </form>
                )}

                {activeReminders.length === 0 && !showAddForm && (
                    <p className="notif-settings__empty">No reminders set.</p>
                )}

                {activeReminders.length > 0 && (
                    <ul className="notif-settings__reminder-list">
                        {activeReminders.map(r => (
                            <ReminderRow
                                key={r.id}
                                reminder={r}
                                overdue={isOverdue(r.deadline)}
                                formattedDate={formatDeadline(r.deadline)}
                                onToggleComplete={() => handleToggleComplete(r)}
                                onDelete={() => handleDeleteReminder(r.id)}
                            />
                        ))}
                    </ul>
                )}

                {completedReminders.length > 0 && (
                    <>
                        <p className="notif-settings__section-label notif-settings__section-label--sub">Completed</p>
                        <ul className="notif-settings__reminder-list notif-settings__reminder-list--done">
                            {completedReminders.map(r => (
                                <ReminderRow
                                    key={r.id}
                                    reminder={r}
                                    overdue={false}
                                    formattedDate={formatDeadline(r.deadline)}
                                    onToggleComplete={() => handleToggleComplete(r)}
                                    onDelete={() => handleDeleteReminder(r.id)}
                                />
                            ))}
                        </ul>
                    </>
                )}
            </section>
        </div>
    );
}

function ToggleRow({ label, description, checked, disabled, onChange }) {
    return (
        <div className="notif-settings__toggle-row">
            <div className="notif-settings__toggle-text">
                <span className="notif-settings__toggle-label">{label}</span>
                <span className="notif-settings__toggle-desc">{description}</span>
            </div>
            <button
                className={`notif-settings__toggle ${checked ? 'notif-settings__toggle--on' : ''}`}
                onClick={onChange}
                disabled={disabled}
                aria-pressed={checked}
            >
                <span className="notif-settings__toggle-thumb" />
            </button>
        </div>
    );
}

function ReminderRow({ reminder, overdue, formattedDate, onToggleComplete, onDelete }) {
    const remindLabel = REMIND_OPTIONS.find(o => o.value === reminder.remind_days_before)?.label ?? '1 day before';
    return (
        <li className={`notif-settings__reminder ${reminder.is_completed ? 'notif-settings__reminder--done' : ''} ${overdue && !reminder.is_completed ? 'notif-settings__reminder--overdue' : ''}`}>
            <button
                className="notif-settings__reminder-check"
                onClick={onToggleComplete}
                title={reminder.is_completed ? 'Mark incomplete' : 'Mark complete'}
            >
                {reminder.is_completed ? '✓' : '○'}
            </button>
            <div className="notif-settings__reminder-body">
                <span className="notif-settings__reminder-title">{reminder.title}</span>
                <span className="notif-settings__reminder-meta">
                    {overdue && !reminder.is_completed ? 'Overdue · ' : ''}{formattedDate} · {remindLabel}
                </span>
            </div>
            <button
                className="notif-settings__reminder-delete"
                onClick={onDelete}
                title="Delete reminder"
            >
                ×
            </button>
        </li>
    );
}

export default NotificationSettings;
