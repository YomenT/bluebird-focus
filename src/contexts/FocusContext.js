import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FocusContext = createContext();

export function useFocus() {
    return useContext(FocusContext);
}

// Mood options — feelings, not ratings
export const MOODS = [
    { key: 'flow', label: 'Flow', icon: '🌊' },
    { key: 'good', label: 'Good', icon: '🌤️' },
    { key: 'scattered', label: 'Scattered', icon: '🌫️' },
    { key: 'stuck', label: 'Stuck', icon: '🪨' },
];

export function FocusProvider({ children }) {
    const { apiCall } = useAuth();

    // Session state
    const [isActive, setIsActive] = useState(false);
    const [sessionLabel, setSessionLabel] = useState('');
    const [sessionLinkedTaskId, setSessionLinkedTaskId] = useState(null);
    const [sessionLinkedTaskLabel, setSessionLinkedTaskLabel] = useState('');
    const [sessionStart, setSessionStart] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Post-session reflection
    const [showReflection, setShowReflection] = useState(false);
    const [pendingSession, setPendingSession] = useState(null);
    const [saving, setSaving] = useState(false);

    // Session history (loaded from backend, paginated)
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [sessionsLoadingMore, setSessionsLoadingMore] = useState(false);
    const [sessionsHasMore, setSessionsHasMore] = useState(false);
    const [sessionsPage, setSessionsPage] = useState(1);

    // Streaks
    const [streaks, setStreaks] = useState([]);
    const [streaksLoading, setStreaksLoading] = useState(false);

    // Settings
    const [settings, setSettings] = useState({
        cadenceMinutes: null,
        showElapsedOnHover: true,
    });

    const timerRef = useRef(null);

    // Elapsed time ticker
    useEffect(() => {
        if (isActive && sessionStart) {
            timerRef.current = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - sessionStart) / 1000));
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, sessionStart]);

    // Load session history — fetches page 1 and resets pagination state
    const loadSessions = useCallback(async () => {
        setSessionsLoading(true);
        try {
            const response = await apiCall('/focus/sessions/?page=1');
            if (response.ok) {
                const data = await response.json();
                setSessions(data.results);
                setSessionsHasMore(data.has_more);
                setSessionsPage(1);
            }
        } catch (err) {
            console.error('Failed to load sessions:', err);
        }
        setSessionsLoading(false);
    }, [apiCall]);

    // Append the next page of sessions
    const loadMoreSessions = useCallback(async (currentPage) => {
        setSessionsLoadingMore(true);
        const nextPage = currentPage + 1;
        try {
            const response = await apiCall(`/focus/sessions/?page=${nextPage}`);
            if (response.ok) {
                const data = await response.json();
                setSessions(prev => [...prev, ...data.results]);
                setSessionsHasMore(data.has_more);
                setSessionsPage(nextPage);
            }
        } catch (err) {
            console.error('Failed to load more sessions:', err);
        }
        setSessionsLoadingMore(false);
    }, [apiCall]);

    // Load streaks — declared before saveSession so it can appear in its dep array
    const loadStreaks = useCallback(async () => {
        setStreaksLoading(true);
        try {
            const response = await apiCall('/focus/streaks/');
            if (response.ok) {
                const data = await response.json();
                setStreaks(data);
            }
        } catch (err) {
            console.error('Failed to load streaks:', err);
        }
        setStreaksLoading(false);
    }, [apiCall]);

    // Begin a focus session
    const beginSession = useCallback((label = '', linkedTaskId = null, linkedTaskLabel = '') => {
        setSessionLabel(label);
        setSessionLinkedTaskId(linkedTaskId);
        setSessionLinkedTaskLabel(linkedTaskLabel);
        setSessionStart(Date.now());
        setElapsedSeconds(0);
        setIsActive(true);
        setShowReflection(false);
        setPendingSession(null);
    }, []);

    // End a focus session — opens reflection prompt
    const endSession = useCallback(() => {
        if (!isActive || !sessionStart) return;

        const durationSeconds = Math.floor((Date.now() - sessionStart) / 1000);
        setPendingSession({
            label: sessionLabel,
            linked_task_id: sessionLinkedTaskId,
            linked_task_label: sessionLinkedTaskLabel,
            started_at: new Date(sessionStart).toISOString(),
            ended_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
        });

        setIsActive(false);
        setSessionStart(null);
        setElapsedSeconds(0);
        setSessionLabel('');
        setSessionLinkedTaskId(null);
        setSessionLinkedTaskLabel('');
        setShowReflection(true);
    }, [isActive, sessionStart, sessionLabel, sessionLinkedTaskId, sessionLinkedTaskLabel]);

    // Save the completed session (after optional reflection)
    const saveSession = useCallback(async (mood = null, note = '') => {
        if (!pendingSession) return;
        setSaving(true);

        const sessionData = {
            ...pendingSession,
            mood: mood || '',
            note: note || '',
        };
        // Remove frontend-only fields
        delete sessionData.linked_task_label;

        try {
            const response = await apiCall('/focus/sessions/create/', {
                method: 'POST',
                body: JSON.stringify(sessionData),
            });
            if (response.ok) {
                const saved = await response.json();
                // Prepend to the in-memory list so the journal reflects it immediately
                setSessions(prev => [saved, ...prev]);
            }
        } catch (err) {
            console.error('Failed to save focus session:', err);
        }

        setSaving(false);
        setPendingSession(null);
        setShowReflection(false);

        // Refresh streak counts since the backend updates them on session save
        if (streaks.length > 0) {
            loadStreaks();
        }
    }, [pendingSession, apiCall, streaks.length, loadStreaks]);

    // Skip reflection and save with no mood/note
    const skipReflection = useCallback(() => {
        saveSession(null, '');
    }, [saveSession]);

    // Discard session entirely (don't save)
    const discardSession = useCallback(() => {
        setPendingSession(null);
        setShowReflection(false);
    }, []);

    // Create a streak
    const createStreak = useCallback(async (streakData) => {
        try {
            const response = await apiCall('/focus/streaks/create/', {
                method: 'POST',
                body: JSON.stringify(streakData),
            });
            if (response.ok) {
                const created = await response.json();
                setStreaks(prev => [created, ...prev]);
                return created;
            }
        } catch (err) {
            console.error('Failed to create streak:', err);
        }
        return null;
    }, [apiCall]);

    // Delete a streak
    const deleteStreak = useCallback(async (streakId) => {
        try {
            const response = await apiCall(`/focus/streaks/${streakId}/delete/`, { method: 'DELETE' });
            if (response.ok || response.status === 204) {
                setStreaks(prev => prev.filter(s => s.id !== streakId));
                return true;
            }
        } catch (err) {
            console.error('Failed to delete streak:', err);
        }
        return false;
    }, [apiCall]);

    // Search tasks from BBTM
    const searchTasks = useCallback(async (query) => {
        if (!query || query.length < 2) return [];
        try {
            const response = await apiCall(`/tasks/search/?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.error('Failed to search tasks:', err);
        }
        return [];
    }, [apiCall]);

    // Format elapsed time in human-friendly way
    const formatElapsed = useCallback(() => {
        if (elapsedSeconds < 60) return 'Just started';
        const minutes = Math.floor(elapsedSeconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0
                ? `About ${hours}h ${remainingMinutes}m`
                : `About ${hours}h`;
        }
        return `About ${minutes}m`;
    }, [elapsedSeconds]);

    // Format a duration in seconds to human-friendly approximate text
    const formatDuration = useCallback((seconds) => {
        if (seconds < 60) return 'Under a minute';
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            const remainingMinutes = minutes % 60;
            if (remainingMinutes >= 25 && remainingMinutes <= 35) {
                return `About ${hours}.5 hrs`;
            }
            if (remainingMinutes < 15) return `About ${hours} hr${hours > 1 ? 's' : ''}`;
            return `About ${hours} hr${hours > 1 ? 's' : ''} ${remainingMinutes}m`;
        }
        const rounded = Math.round(minutes / 5) * 5 || minutes;
        return `About ${rounded} min`;
    }, []);

    const value = {
        // Session state
        isActive,
        sessionLabel,
        sessionLinkedTaskLabel,
        sessionStart,
        elapsedSeconds,
        formatElapsed,
        formatDuration,

        // Actions
        beginSession,
        endSession,

        // Reflection
        showReflection,
        pendingSession,
        saveSession,
        skipReflection,
        discardSession,
        saving,

        // History
        sessions,
        sessionsLoading,
        sessionsLoadingMore,
        sessionsHasMore,
        sessionsPage,
        loadSessions,
        loadMoreSessions,

        // Tasks
        searchTasks,

        // Streaks
        streaks,
        streaksLoading,
        loadStreaks,
        createStreak,
        deleteStreak,

        // Settings
        settings,
        setSettings,
    };

    return (
        <FocusContext.Provider value={value}>
            {children}
        </FocusContext.Provider>
    );
}
