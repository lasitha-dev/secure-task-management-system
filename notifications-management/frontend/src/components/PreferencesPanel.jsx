import { TYPE_LABELS } from '../constants/notificationMeta';

export default function PreferencesPanel({ isOpen, preferences, onClose, onSave, onToggleGlobal, onToggleType }) {
  const typePreferences = preferences.preferences || {};

  return (
    <>
      <div className={`prefs-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`prefs-panel ${isOpen ? 'open' : ''}`}>
        <div className="prefs-header">
          <h2>Notification Preferences</h2>
          <button className="prefs-close-btn" onClick={onClose}>
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        <div className="prefs-body">
          <div className="pref-section">
            <div className="pref-section-title">Global Settings</div>
            <div className="pref-row">
              <div>
                <div className="pref-label">Email Notifications</div>
                <div className="pref-hint">Receive alerts via email</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={Boolean(preferences.emailEnabled)}
                  onChange={() => onToggleGlobal('emailEnabled')}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="pref-row">
              <div>
                <div className="pref-label">In-App Notifications</div>
                <div className="pref-hint">Show alerts within the application</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={Boolean(preferences.inAppEnabled)}
                  onChange={() => onToggleGlobal('inAppEnabled')}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
          <div className="pref-section">
            <div className="pref-section-title">By Notification Type</div>
            <div>
              {Object.entries(TYPE_LABELS).map(([type, label]) => (
                <div className="pref-row" key={type}>
                  <div>
                    <div className="pref-label">{label}</div>
                    <div className="pref-hint">Enable this notification category</div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={typePreferences[type]?.enabled ?? true}
                      onChange={() => onToggleType(type)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="prefs-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <span className="material-icons-outlined">save</span>
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}