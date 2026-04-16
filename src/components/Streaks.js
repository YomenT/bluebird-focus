import React, { useEffect, useState } from 'react';
import { useFocus } from '../contexts/FocusContext';
import '../styles/Streaks.css';

const CADENCE_OPTIONS = [
    { type: 'daily', value: 1, label: 'Every day' },
    { type: 'every_n_days', value: 2, label: 'Every 2 days' },
    { type: 'every_n_days', value: 3, label: 'Every 3 days' },
    { type: 'every_n_days', value: 7, label: 'Every 7 days' },
    { type: 'weekly', value: 1, label: 'Once a week' },
];

/**
 * Returns the streak's status relative to today.
 * - 'active'   : session completed in the current period
 * - 'at_risk'  : period is open but no session yet
 * - 'broken'   : missed the window (count would reset on next save)
 * - 'new'      : never had a session
 */
function getStreakStatus(streak) {
    const { cadence_type, cadence_value, last_session_date } = streak;
    if (!last_session_date) return 'new';

    const last = new Date(last_session_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

    if (cadence_type === 'daily') {
        if (diffDays === 0) return 'active';
        if (diffDays === 1) return 'at_risk';
        return 'broken';
    }

    if (cadence_type === 'every_n_days') {
        const n = cadence_value || 1;
        if (diffDays === 0) return 'active';
        if (diffDays < n) return 'at_risk';
        return 'broken';
    }

    if (cadence_type === 'weekly') {
        // Get Monday of last session's week vs this week
        const lastMonday = new Date(last);
        const dow = lastMonday.getDay();
        lastMonday.setDate(lastMonday.getDate() - (dow === 0 ? 6 : dow - 1));
        const todayMonday = new Date(today);
        const todayDow = todayMonday.getDay();
        todayMonday.setDate(todayMonday.getDate() - (todayDow === 0 ? 6 : todayDow - 1));
        const weeksDiff = Math.round((todayMonday - lastMonday) / (7 * 24 * 60 * 60 * 1000));

        if (weeksDiff === 0) return 'active';
        if (weeksDiff === 1) return 'at_risk';
        return 'broken';
    }

    return 'new';
}

function cadenceLabel(streak) {
    if (streak.cadence_type === 'daily') return 'Every day';
    if (streak.cadence_type === 'weekly') return 'Once a week';
    if (streak.cadence_type === 'every_n_days') {
        return `Every ${streak.cadence_value} days`;
    }
    return '';
}

function StreakCard({ streak, onDelete }) {
    const status = getStreakStatus(streak);
    const displayCount = status === 'broken' ? 0 : streak.current_count;

    const statusConfig = {
        active: { icon: '🔥', label: 'On track', className: 'streak-card--active' },
        at_risk: { icon: '⏳', label: 'Focus today', className: 'streak-card--at-risk' },
        broken: { icon: '💧', label: 'Streak reset', className: 'streak-card--broken' },
        new: { icon: '✦', label: 'Just started', className: 'streak-card--new' },
    }[status] || { icon: '✦', label: '', className: '' };

    return (
        <div className={`streak-card ${statusConfig.className}`}>
            <div className="streak-card__left">
                <span className="streak-card__icon">{statusConfig.icon}</span>
                <div className="streak-card__info">
                    <span className="streak-card__name">{streak.name}</span>
                    <span className="streak-card__cadence">{cadenceLabel(streak)}</span>
                </div>
            </div>
            <div className="streak-card__right">
                <div className="streak-card__count-block">
                    <span className="streak-card__count">{displayCount}</span>
                    <span className="streak-card__count-label">
                        {displayCount === 1 ? 'period' : 'periods'}
                    </span>
                </div>
                {streak.longest_count > 0 && (
                    <span className="streak-card__best" title="Personal best">
                        best {streak.longest_count}
                    </span>
                )}
                <span className="streak-card__status-label">{statusConfig.label}</span>
                <button
                    className="streak-card__delete"
                    onClick={() => onDelete(streak.id)}
                    title="Remove streak"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

function Streaks({ onBack }) {
    const { streaks, streaksLoading, loadStreaks, createStreak, deleteStreak } = useFocus();
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState('');
    const [formCadenceIdx, setFormCadenceIdx] = useState(0);
    const [formSaving, setFormSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        loadStreaks();
    }, [loadStreaks]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formName.trim()) return;
        setFormSaving(true);
        const option = CADENCE_OPTIONS[formCadenceIdx];
        await createStreak({
            name: formName.trim(),
            cadence_type: option.type,
            cadence_value: option.value,
        });
        setFormName('');
        setFormCadenceIdx(0);
        setShowForm(false);
        setFormSaving(false);
    };

    const handleDelete = async (streakId) => {
        setDeletingId(streakId);
        await deleteStreak(streakId);
        setDeletingId(null);
    };

    return (
        <div className="streaks">
            <div className="streaks__header">
                <button className="streaks__back" onClick={onBack}>←</button>
                <h2 className="streaks__title">Streaks</h2>
                {!showForm && (
                    <button
                        className="streaks__add-btn"
                        onClick={() => setShowForm(true)}
                    >
                        + New
                    </button>
                )}
            </div>

            <p className="streaks__hint">
                A streak tracks how consistently you focus. Complete at least one session per period to keep it alive.
            </p>

            {showForm && (
                <form className="streaks__form" onSubmit={handleCreate}>
                    <input
                        className="streaks__form-input"
                        type="text"
                        placeholder="e.g. Morning focus, Deep work..."
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        maxLength={120}
                        autoFocus
                    />
                    <div className="streaks__form-row">
                        <label className="streaks__form-label">Cadence</label>
                        <select
                            className="streaks__form-select"
                            value={formCadenceIdx}
                            onChange={e => setFormCadenceIdx(parseInt(e.target.value))}
                        >
                            {CADENCE_OPTIONS.map((opt, idx) => (
                                <option key={idx} value={idx}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="streaks__form-actions">
                        <button
                            type="button"
                            className="streaks__form-cancel"
                            onClick={() => { setShowForm(false); setFormName(''); setFormCadenceIdx(0); }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="streaks__form-save"
                            disabled={formSaving || !formName.trim()}
                        >
                            {formSaving ? 'Saving…' : 'Create'}
                        </button>
                    </div>
                </form>
            )}

            {streaksLoading ? (
                <div className="streaks__loading">
                    <div className="streaks__loading-pulse" />
                    <span>Loading streaks…</span>
                </div>
            ) : streaks.length === 0 && !showForm ? (
                <div className="streaks__empty">
                    <p>No streaks yet.</p>
                    <p className="streaks__empty-hint">
                        Create one to start building a consistent focus habit.
                    </p>
                </div>
            ) : (
                <div className="streaks__list">
                    {streaks.map(streak => (
                        <StreakCard
                            key={streak.id}
                            streak={streak}
                            onDelete={deletingId === streak.id ? () => {} : handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Streaks;
