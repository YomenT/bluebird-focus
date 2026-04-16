import React, { useEffect, useState, useMemo } from 'react';
import { useFocus, MOODS } from '../contexts/FocusContext';
import { useAuth } from '../contexts/AuthContext';
import WeeklySummary from './WeeklySummary';
import FocusHeatmap from './FocusHeatmap';
import InsightCards from './InsightCards';
import '../styles/Journal.css';

const REST_MESSAGES = [
    "You've been putting in real work lately. It's good to take a break.",
    "Deep focus takes energy — make sure rest is part of the routine too.",
    "You're on a roll. Don't forget to step away and breathe.",
];

const RETURN_MESSAGES = [
    "It's been a while. Even a short session can help you find your rhythm.",
    "Time to get back into gear. One session at a time.",
    "The orb is waiting — whenever you're ready.",
];

function Journal({ onBack }) {
    const {
        sessions,
        sessionsLoading,
        sessionsLoadingMore,
        sessionsHasMore,
        sessionsPage,
        loadSessions,
        loadMoreSessions,
        formatDuration,
    } = useFocus();
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

    const zenMessage = useMemo(() => {
        if (!sessions.length) return null;
        const now = Date.now();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const recentCount = sessions.filter(s => now - new Date(s.started_at) < threeDaysMs).length;
        const weekCount = sessions.filter(s => now - new Date(s.started_at) < sevenDaysMs).length;
        if (recentCount >= 3) {
            return REST_MESSAGES[Math.floor(Math.random() * REST_MESSAGES.length)];
        }
        if (weekCount === 0) {
            return RETURN_MESSAGES[Math.floor(Math.random() * RETURN_MESSAGES.length)];
        }
        return null;
    }, [sessions]);

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

                    {zenMessage && (
                        <p className="journal__zen">{zenMessage}</p>
                    )}

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

                    {sessionsHasMore && (
                        <button
                            className="journal__load-more"
                            onClick={() => loadMoreSessions(sessionsPage)}
                            disabled={sessionsLoadingMore}
                        >
                            {sessionsLoadingMore ? (
                                <span className="journal__load-more-loading">
                                    <span className="journal__load-more-dot" />
                                    Loading…
                                </span>
                            ) : (
                                'Load more'
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default Journal;
