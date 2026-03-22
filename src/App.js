import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FocusProvider, useFocus } from './contexts/FocusContext';
import FocusOrb from './components/FocusOrb';
import BeginSession from './components/BeginSession';
import ActiveSession from './components/ActiveSession';
import Reflection from './components/Reflection';
import Journal from './components/Journal';
import Login from './components/Login';
import UserMenu from './components/UserMenu';
import './App.css';

const VIEWS = {
    CLOSED: 'closed',
    BEGIN: 'begin',
    ACTIVE: 'active',
    JOURNAL: 'journal',
};

function FocusApp() {
    const { user, loading } = useAuth();
    const { isActive, showReflection } = useFocus();
    const [view, setView] = useState(VIEWS.CLOSED);

    // After reflection is dismissed (save/skip/discard), close the panel
    React.useEffect(() => {
        if (!showReflection && !isActive && view === VIEWS.ACTIVE) {
            setView(VIEWS.CLOSED);
        }
    }, [showReflection, isActive, view]);

    if (loading) {
        return (
            <div className="app app--loading">
                <div className="app__loading-orb" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="app app--login">
                <Login />
            </div>
        );
    }

    const handleOrbClick = () => {
        if (showReflection) {
            setView(VIEWS.ACTIVE);
            return;
        }
        if (isActive) {
            setView(view === VIEWS.ACTIVE ? VIEWS.CLOSED : VIEWS.ACTIVE);
            return;
        }
        setView(view === VIEWS.BEGIN ? VIEWS.CLOSED : VIEWS.BEGIN);
    };

    const closePanel = () => setView(VIEWS.CLOSED);

    const isJournalView = view === VIEWS.JOURNAL;

    return (
        <div className="app">
            <div className="app__topbar">
                <span className="app__brand">Bluebird Focus</span>
                <div className="app__topbar-actions">
                    <button
                        className={`app__journal-btn ${isJournalView ? 'app__journal-btn--active' : ''}`}
                        onClick={() => setView(isJournalView ? VIEWS.CLOSED : VIEWS.JOURNAL)}
                        title="Focus Journal"
                    >
                        ☰
                    </button>
                    <UserMenu />
                </div>
            </div>

            <div className="app__main">
                {isJournalView ? (
                    <Journal onBack={closePanel} />
                ) : showReflection ? (
                    <Reflection />
                ) : view === VIEWS.BEGIN ? (
                    <BeginSession onClose={closePanel} />
                ) : view === VIEWS.ACTIVE ? (
                    <ActiveSession onClose={closePanel} />
                ) : (
                    <div className="app__orb-container">
                        <FocusOrb onClick={handleOrbClick} />
                        <p className="app__orb-hint">
                            {isActive
                                ? 'Click to see your session'
                                : 'Click to begin focusing'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <FocusProvider>
                <FocusApp />
            </FocusProvider>
        </AuthProvider>
    );
}

export default App;
