import React, { useMemo } from 'react';
import { useFocus } from '../contexts/FocusContext';
import '../styles/InsightCards.css';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_PERIOD_ICONS = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌆',
    night: '🌙',
};

const TIME_PERIOD_LABELS = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Late Night',
};

function getTimePeriod(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 23) return 'evening';
    return 'night';
}

function fmtSeconds(seconds) {
    const m = Math.round(seconds / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function InsightCards() {
    const { sessions } = useFocus();

    const cards = useMemo(() => {
        if (sessions.length === 0) return [];
        const result = [];

        // --- Streak: consecutive days with ≥1 session ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sessionDaySet = new Set(
            sessions.map(s => {
                const d = new Date(s.started_at);
                d.setHours(0, 0, 0, 0);
                return d.getTime();
            })
        );
        let streak = 0;
        const cursor = new Date(today);
        while (sessionDaySet.has(cursor.getTime())) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }
        // If today has no session yet, still count a maintained streak from yesterday
        if (streak === 0) {
            cursor.setDate(cursor.getDate() - 1);
            while (sessionDaySet.has(cursor.getTime())) {
                streak++;
                cursor.setDate(cursor.getDate() - 1);
            }
        }
        result.push({
            id: 'streak',
            icon: streak >= 5 ? '🔥' : streak >= 2 ? '⚡' : '📍',
            value: streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''}` : 'None yet',
            label: 'focus streak',
            highlight: streak >= 7,
        });

        // --- Personal best ---
        const longest = sessions.reduce((max, s) => Math.max(max, s.duration_seconds), 0);
        result.push({
            id: 'best',
            icon: '🏆',
            value: fmtSeconds(longest),
            label: 'longest session',
        });

        // --- Best day of week (≥7 sessions across ≥3 different weekdays) ---
        if (sessions.length >= 7) {
            const minutesByDow = {};
            sessions.forEach(s => {
                const dow = new Date(s.started_at).getDay();
                minutesByDow[dow] = (minutesByDow[dow] || 0) + s.duration_seconds / 60;
            });
            if (Object.keys(minutesByDow).length >= 3) {
                const bestDow = +Object.entries(minutesByDow).sort((a, b) => b[1] - a[1])[0][0];
                result.push({
                    id: 'bestday',
                    icon: '📅',
                    value: DAY_NAMES[bestDow],
                    label: 'most productive day',
                });
            }
        }

        // --- Peak time of day (≥5 sessions) ---
        if (sessions.length >= 5) {
            const minutesByPeriod = {};
            sessions.forEach(s => {
                const period = getTimePeriod(new Date(s.started_at).getHours());
                minutesByPeriod[period] = (minutesByPeriod[period] || 0) + s.duration_seconds / 60;
            });
            const peak = Object.entries(minutesByPeriod).sort((a, b) => b[1] - a[1])[0][0];
            result.push({
                id: 'peaktime',
                icon: TIME_PERIOD_ICONS[peak],
                value: TIME_PERIOD_LABELS[peak],
                label: 'peak focus time',
            });
        }

        // --- Flow rate (≥5 sessions with mood recorded) ---
        const moodedSessions = sessions.filter(s => s.mood);
        if (moodedSessions.length >= 5) {
            const flowCount = moodedSessions.filter(s => s.mood === 'flow').length;
            const pct = Math.round((flowCount / moodedSessions.length) * 100);
            result.push({
                id: 'flowrate',
                icon: '🌊',
                value: `${pct}%`,
                label: 'flow state rate',
                highlight: pct >= 50,
            });
        }

        // --- Task duration boost (≥3 sessions each with and without a linked task, ≥10% diff) ---
        const withTask = sessions.filter(s => s.linked_task_id);
        const noTask = sessions.filter(s => !s.linked_task_id);
        if (withTask.length >= 3 && noTask.length >= 3) {
            const avgWith = withTask.reduce((sum, s) => sum + s.duration_seconds, 0) / withTask.length;
            const avgNo = noTask.reduce((sum, s) => sum + s.duration_seconds, 0) / noTask.length;
            const pct = Math.round(((avgWith - avgNo) / avgNo) * 100);
            if (Math.abs(pct) >= 10) {
                result.push({
                    id: 'taskboost',
                    icon: pct > 0 ? '✅' : '📌',
                    value: `${pct > 0 ? '+' : ''}${pct}%`,
                    label: 'duration with a task',
                });
            }
        }

        return result;
    }, [sessions]);

    if (cards.length === 0) return null;

    return (
        <div className="insight-cards">
            <h3 className="insight-cards__title">Insights</h3>
            <div className="insight-cards__grid">
                {cards.map(card => (
                    <div
                        key={card.id}
                        className={`insight-card${card.highlight ? ' insight-card--highlight' : ''}`}
                    >
                        <span className="insight-card__icon">{card.icon}</span>
                        <span className="insight-card__value">{card.value}</span>
                        <span className="insight-card__label">{card.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default InsightCards;
