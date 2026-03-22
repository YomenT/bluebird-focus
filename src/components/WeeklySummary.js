import React from 'react';
import { useFocus, MOODS } from '../contexts/FocusContext';
import '../styles/WeeklySummary.css';

function WeeklySummary() {
    const { sessions, formatDuration } = useFocus();

    // Get sessions from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekSessions = sessions.filter(
        s => new Date(s.started_at) >= weekAgo
    );

    if (weekSessions.length === 0) return null;

    const totalSeconds = weekSessions.reduce((sum, s) => sum + s.duration_seconds, 0);

    // Find most common mood
    const moodCounts = {};
    weekSessions.forEach(s => {
        if (s.mood) {
            moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1;
        }
    });
    const topMoodKey = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topMood = MOODS.find(m => m.key === topMoodKey);

    return (
        <div className="weekly-summary">
            <h3 className="weekly-summary__title">This week</h3>
            <div className="weekly-summary__stats">
                <div className="weekly-summary__stat">
                    <span className="weekly-summary__stat-value">{weekSessions.length}</span>
                    <span className="weekly-summary__stat-label">
                        session{weekSessions.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="weekly-summary__stat">
                    <span className="weekly-summary__stat-value">{formatDuration(totalSeconds)}</span>
                    <span className="weekly-summary__stat-label">total</span>
                </div>
                {topMood && (
                    <div className="weekly-summary__stat">
                        <span className="weekly-summary__stat-value">{topMood.icon}</span>
                        <span className="weekly-summary__stat-label">mostly {topMood.label.toLowerCase()}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WeeklySummary;
