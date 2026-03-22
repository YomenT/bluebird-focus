import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocus } from '../contexts/FocusContext';
import '../styles/BeginSession.css';

function BeginSession({ onClose }) {
    const { beginSession, searchTasks } = useFocus();
    const [label, setLabel] = useState('');
    const [taskQuery, setTaskQuery] = useState('');
    const [taskResults, setTaskResults] = useState([]);
    const [taskSearching, setTaskSearching] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskSearch, setShowTaskSearch] = useState(false);
    const searchTimeout = useRef(null);

    // Debounced task search
    const handleTaskSearch = useCallback((query) => {
        setTaskQuery(query);
        clearTimeout(searchTimeout.current);

        if (query.length < 2) {
            setTaskResults([]);
            setTaskSearching(false);
            return;
        }

        setTaskSearching(true);
        searchTimeout.current = setTimeout(async () => {
            const results = await searchTasks(query);
            setTaskResults(results);
            setTaskSearching(false);
        }, 400);
    }, [searchTasks]);

    useEffect(() => {
        return () => clearTimeout(searchTimeout.current);
    }, []);

    const handleSelectTask = (task) => {
        setSelectedTask({ ...task, displayId: task.board_task_id });
        setLabel(task.title);
        setTaskQuery('');
        setTaskResults([]);
        setShowTaskSearch(false);
    };

    const handleClearTask = () => {
        setSelectedTask(null);
    };

    const handleBegin = () => {
        beginSession(
            label.trim(),
            selectedTask?.id || null,
            selectedTask ? `${selectedTask.displayId}: ${selectedTask.title}` : ''
        );
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !showTaskSearch) {
            handleBegin();
        }
    };

    return (
        <div className="begin-session">
            <div className="begin-session__header">
                <h2>What are you working on?</h2>
                <p className="begin-session__hint">Optional — you can leave this blank</p>
            </div>

            <input
                type="text"
                className="begin-session__input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Auth refactor, code review..."
                autoFocus
                maxLength={120}
            />

            {/* Task linking */}
            <div className="begin-session__task-link">
                {selectedTask ? (
                    <div className="begin-session__selected-task">
                        <span className="begin-session__task-id">{selectedTask.displayId}</span>
                        <span className="begin-session__task-title">{selectedTask.title}</span>
                        <button
                            className="begin-session__task-clear"
                            onClick={handleClearTask}
                            title="Unlink task"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <button
                        className="begin-session__link-task-btn"
                        onClick={() => setShowTaskSearch(!showTaskSearch)}
                    >
                        {showTaskSearch ? 'Cancel' : 'Link a task'}
                    </button>
                )}

                {showTaskSearch && (
                    <div className="begin-session__task-search">
                        <input
                            type="text"
                            className="begin-session__task-search-input"
                            value={taskQuery}
                            onChange={(e) => handleTaskSearch(e.target.value)}
                            placeholder="Search tasks (e.g. BBTM-42 or keyword)..."
                            autoFocus
                        />
                        {taskSearching && (
                            <div className="begin-session__task-loading">
                                <div className="begin-session__task-loading-dot" />
                                Searching...
                            </div>
                        )}
                        {!taskSearching && taskResults.length > 0 && (
                            <div className="begin-session__task-results">
                                {taskResults.slice(0, 5).map((task) => {
                                    return (
                                        <button
                                            key={task.id}
                                            className="begin-session__task-result"
                                            onClick={() => handleSelectTask(task)}
                                        >
                                            <span className="begin-session__task-result-id">{task.board_task_id}</span>
                                            <span className="begin-session__task-result-title">{task.title}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {!taskSearching && taskQuery.length >= 2 && taskResults.length === 0 && (
                            <p className="begin-session__task-empty">No tasks found</p>
                        )}
                    </div>
                )}
            </div>

            <div className="begin-session__actions">
                <button
                    className="begin-session__btn begin-session__btn--begin"
                    onClick={handleBegin}
                >
                    Begin
                </button>
                <button
                    className="begin-session__btn begin-session__btn--cancel"
                    onClick={onClose}
                >
                    Not now
                </button>
            </div>
        </div>
    );
}

export default BeginSession;
