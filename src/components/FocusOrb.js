import React, { useState } from 'react';
import { useFocus } from '../contexts/FocusContext';
import '../styles/FocusOrb.css';

function FocusOrb({ onClick }) {
    const { isActive, formatElapsed, showReflection } = useFocus();
    const [hovered, setHovered] = useState(false);

    const cupClass = [
        'focus-cup',
        isActive ? 'focus-cup--active' : showReflection ? 'focus-cup--reflecting' : 'focus-cup--idle',
    ].join(' ');

    return (
        <button
            className={cupClass}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={isActive ? 'View session' : 'Begin focusing'}
        >
            <div className="focus-cup__steam-area">
                <div className="focus-cup__steam focus-cup__steam--1" />
                <div className="focus-cup__steam focus-cup__steam--2" />
                <div className="focus-cup__steam focus-cup__steam--3" />
            </div>
            <div className="focus-cup__cup">
                <div className="focus-cup__cup-body" />
                <div className="focus-cup__cup-handle" />
            </div>
            <div className="focus-cup__saucer" />
            {isActive && hovered && (
                <span className="focus-cup__elapsed">{formatElapsed()}</span>
            )}
        </button>
    );
}

export default FocusOrb;
