import React, { useState, useMemo } from 'react';
import { useFocus } from '../contexts/FocusContext';
import '../styles/FocusHeatmap.css';

function getLevel(minutes) {
    if (minutes === 0) return 0;
    if (minutes < 30) return 1;
    if (minutes < 60) return 2;
    if (minutes < 120) return 3;
    return 4;
}

function toDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function FocusHeatmap() {
    const { sessions } = useFocus();
    const [hovered, setHovered] = useState(null);

    const weeks = useMemo(() => {
        const minutesByDay = {};
        sessions.forEach(s => {
            const d = new Date(s.started_at);
            const key = toDateKey(d);
            minutesByDay[key] = (minutesByDay[key] || 0) + Math.round(s.duration_seconds / 60);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Start from the Sunday that begins the 12-week window
        const thisSunday = new Date(today);
        thisSunday.setDate(thisSunday.getDate() - thisSunday.getDay());
        const startSunday = new Date(thisSunday);
        startSunday.setDate(startSunday.getDate() - 11 * 7);

        const weeks = [];
        for (let w = 0; w < 12; w++) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(startSunday);
                date.setDate(date.getDate() + w * 7 + d);
                const isFuture = date > today;
                const key = toDateKey(date);
                week.push({
                    date,
                    key,
                    minutes: isFuture ? -1 : (minutesByDay[key] || 0),
                    isFuture,
                });
            }
            weeks.push(week);
        }
        return weeks;
    }, [sessions]);

    const hoveredLabel = hovered && !hovered.isFuture
        ? hovered.minutes > 0
            ? `${hovered.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${hovered.minutes}m`
            : `${hovered.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · no sessions`
        : null;

    return (
        <div className="focus-heatmap">
            <h3 className="focus-heatmap__title">12-Week Activity</h3>
            <div className="focus-heatmap__grid-wrapper">
                <div className="focus-heatmap__day-labels">
                    {DAY_LABELS.map((label, i) => (
                        <span key={i} className="focus-heatmap__day-label">{label}</span>
                    ))}
                </div>
                <div className="focus-heatmap__grid">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="focus-heatmap__week">
                            {week.map((cell, di) => (
                                <div
                                    key={di}
                                    className={[
                                        'focus-heatmap__cell',
                                        cell.isFuture
                                            ? 'focus-heatmap__cell--future'
                                            : `focus-heatmap__cell--level-${getLevel(cell.minutes)}`
                                    ].join(' ')}
                                    onMouseEnter={() => setHovered(cell)}
                                    onMouseLeave={() => setHovered(null)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="focus-heatmap__footer">
                <span className="focus-heatmap__hover-label">
                    {hoveredLabel || '\u00A0'}
                </span>
                <div className="focus-heatmap__legend">
                    <span className="focus-heatmap__legend-text">Less</span>
                    {[0, 1, 2, 3, 4].map(l => (
                        <div key={l} className={`focus-heatmap__legend-cell focus-heatmap__cell--level-${l}`} />
                    ))}
                    <span className="focus-heatmap__legend-text">More</span>
                </div>
            </div>
        </div>
    );
}

export default FocusHeatmap;
