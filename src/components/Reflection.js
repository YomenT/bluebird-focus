import React, { useState } from 'react';
import { useFocus, MOODS } from '../contexts/FocusContext';
import '../styles/Reflection.css';

function Reflection() {
    const { pendingSession, saveSession, skipReflection, discardSession, formatDuration, saving } = useFocus();
    const [selectedMood, setSelectedMood] = useState(null);
    const [note, setNote] = useState('');

    if (!pendingSession) return null;

    const handleSave = () => {
        saveSession(selectedMood, note.trim());
    };

    return (
        <div className="reflection">
            <p className="reflection__duration">
                {formatDuration(pendingSession.duration_seconds)}
            </p>

            {pendingSession.label && (
                <p className="reflection__label">{pendingSession.label}</p>
            )}

            {pendingSession.linked_task_label && (
                <p className="reflection__linked-task">{pendingSession.linked_task_label}</p>
            )}

            <div className="reflection__mood-section">
                <p className="reflection__prompt">How did that feel?</p>
                <div className="reflection__moods">
                    {MOODS.map((mood) => (
                        <button
                            key={mood.key}
                            className={`reflection__mood-btn ${
                                selectedMood === mood.key ? 'reflection__mood-btn--selected' : ''
                            }`}
                            onClick={() => setSelectedMood(
                                selectedMood === mood.key ? null : mood.key
                            )}
                            title={mood.label}
                            disabled={saving}
                        >
                            <span className="reflection__mood-icon">{mood.icon}</span>
                            <span className="reflection__mood-label">{mood.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="reflection__note-section">
                <textarea
                    className="reflection__note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything to note?"
                    rows={2}
                    maxLength={500}
                    disabled={saving}
                />
            </div>

            <div className="reflection__actions">
                <button
                    className="reflection__btn reflection__btn--save"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                    className="reflection__btn reflection__btn--skip"
                    onClick={skipReflection}
                    disabled={saving}
                >
                    {saving ? '...' : 'Skip'}
                </button>
                <button
                    className="reflection__btn reflection__btn--discard"
                    onClick={discardSession}
                    disabled={saving}
                >
                    Discard
                </button>
            </div>
        </div>
    );
}

export default Reflection;
