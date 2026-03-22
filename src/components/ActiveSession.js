import React from 'react';
import { useFocus } from '../contexts/FocusContext';
import '../styles/ActiveSession.css';

function ActiveSession({ onClose }) {
    const { sessionLabel, sessionLinkedTaskLabel, formatElapsed, endSession } = useFocus();

    const handleEnd = () => {
        endSession();
        // Don't close — reflection will show
    };

    return (
        <div className="active-session">
            <div className="active-session__status">
                <div className="active-session__pulse" />
                <span className="active-session__label">Focusing</span>
            </div>

            {sessionLabel && (
                <p className="active-session__task">{sessionLabel}</p>
            )}

            {sessionLinkedTaskLabel && (
                <p className="active-session__linked-task">{sessionLinkedTaskLabel}</p>
            )}

            <p className="active-session__elapsed">{formatElapsed()}</p>

            <div className="active-session__actions">
                <button
                    className="active-session__btn active-session__btn--end"
                    onClick={handleEnd}
                >
                    Finish
                </button>
                <button
                    className="active-session__btn active-session__btn--minimize"
                    onClick={onClose}
                >
                    Minimize
                </button>
            </div>
        </div>
    );
}

export default ActiveSession;
