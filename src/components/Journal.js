import React, { useEffect, useState } from 'react';
import { useFocus, MOODS } from '../contexts/FocusContext';
import { useAuth } from '../contexts/AuthContext';
import WeeklySummary from './WeeklySummary';
import FocusHeatmap from './FocusHeatmap';
import InsightCards from './InsightCards';
import '../styles/Journal.css';

function Journal({ onBack }) {
    const { sessions, sessionsLoading, loadSessions, formatDuration } = useFocus();
    const { apiCall } = useAuth();
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // Group sessions by date
    const groupedByDate = sessions.reduce((groups, session) => {
        const date = new Date(session.started_at).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(session);
        return groups;
    }, {});

    const getMoodIcon = (moodKey) => {
        const mood = MOODS.find(m => m.key === moodKey);
        return mood ? mood.icon : '';
    };

    const handleDelete = async (sessionId) => {
        setDeletingId(sessionId);
        try {
            const response = await apiCall(`/focus/sessions/${sessionId}/delete/`, {
                method: 'DELETE',
            });
            if (response.ok || response.status === 204) {
                loadSessions();
            }
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
        setDeletingId(null);
    };

    return (
        <div className="journal">
            <div className="journal__header">
                <button className="journal__back" onClick={onBack}>←</button>
                <h2 className="journal__title">Focus Journal</h2>
            </div>

            {sessionsLoading ? (
                <div className="journal__loading">
                    <div className="journal__loading-pulse" />
                    <span className="journal__loading-text">Loading your sessions...</span>
                    <div className="journal__loading-skeleton">
                        <div className="journal__skeleton-row">
                            <div className="journal__skeleton-dot" />
                            <div className="journal__skeleton-line journal__skeleton-line--long" />
                        </div>
                        <div className="journal__skeleton-row">
                            <div className="journal__skeleton-dot" />
                            <div className="journal__skeleton-line journal__skeleton-line--medium" />
                        </div>
                        <div className="journal__skeleton-row">
                            <div className="journal__skeleton-dot" />
                            <div className="journal__skeleton-line journal__skeleton-line--short" />
                        </div>
                    </div>
                </div>
            ) : sessions.length === 0 ? (
                <div className="journal__empty">
                    <p>No sessions yet.</p>
                    <p className="journal__empty-hint">
                        Your focus sessions will appear here as a quiet timeline.
                    </p>
                </div>
            ) : (
                <div className="journal__content">
                    <FocusHeatmap />
                    <InsightCards />
                    <WeeklySummary />

                    <div className="journal__timeline">
                        {Object.entries(groupedByDate).map(([date, daySessions]) => (
                            <div key={date} className="journal__day">
                                <h3 className="journal__date">{date}</h3>
                                <div className="journal__sessions">
                                    {daySessions.map((session) => (
                                        <div key={session.id} className="journal__entry">
                                            <div className="journal__entry-dot" />
                                            <div className="journal__entry-content">
                                                <div className="journal__entry-header">
                                                    <span className="journal__entry-label">
                                                        {session.label || '(unlabeled session)'}
                                                    </span>
                                                    <span className="journal__entry-duration">
                                                        {formatDuration(session.duration_seconds)}
                                                    </span>
                                                    {session.mood && (
                                                        <span className="journal__entry-mood">
                                                            {getMoodIcon(session.mood)}
                                                        </span>
                                                    )}
                                                </div>
                                                {session.note && (
                                                    <p className="journal__entry-note">
                                                        "{session.note}"
                                                    </p>
                                                )}
                                                <button
                                                    className="journal__entry-delete"
                                                    onClick={() => handleDelete(session.id)}
                                                    disabled={deletingId === session.id}
                                                    title="Delete session"
                                                >
                                                    {deletingId === session.id ? '...' : '×'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Journal;
