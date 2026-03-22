import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../firebase';
import { openExternal, BLUEBIRD_DOCS_URL } from '../utils/openExternal';
import '../styles/UserMenu.css';

const BLUEBIRD_TASKS_URL = 'https://bluebird-task-management.web.app';

function UserMenu() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleLogout = async () => {
        setLoggingOut(true);
        setOpen(false);
        await logout();
    };

    const handleOpenDocs = () => {
        setOpen(false);
        openExternal(BLUEBIRD_DOCS_URL);
    };

    const handleOpenTasks = () => {
        setOpen(false);
        openExternal(BLUEBIRD_TASKS_URL);
    };

    // Get initials from email
    const initial = user?.email ? user.email[0].toUpperCase() : '?';

    return (
        <div className="user-menu" ref={menuRef}>
            <button
                className="user-menu__trigger"
                onClick={() => setOpen(!open)}
                title={user?.email}
                disabled={loggingOut}
            >
                {loggingOut ? '...' : initial}
            </button>

            {open && (
                <div className="user-menu__dropdown">
                    <div className="user-menu__info">
                        <span className="user-menu__email">{user?.email}</span>
                    </div>
                    <div className="user-menu__divider" />
                    <button className="user-menu__item" onClick={handleOpenDocs}>
                        Bluebird Docs
                    </button>
                    <button className="user-menu__item" onClick={handleOpenTasks}>
                        Bluebird Tasks
                    </button>
                    <div className="user-menu__divider" />
                    <button className="user-menu__item user-menu__item--logout" onClick={handleLogout}>
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}

export default UserMenu;
