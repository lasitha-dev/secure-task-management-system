/* eslint-disable react/prop-types */

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ');
}

function normalizeTabItem(item) {
  if (typeof item === 'string') {
    return { key: item, label: item };
  }

  return item;
}

export function AppSidebarShell({ children, footer, className = '' }) {
  return (
    <aside className={joinClassNames('tm-sidebar-shell', className)}>
      <div>{children}</div>
      {footer ? <div className="tm-sidebar-footer">{footer}</div> : null}
    </aside>
  );
}

export function AppSidebarBrand({ title = 'TaskMaster', subtitle = '' }) {
  return (
    <div className="tm-sidebar-brand">
      <div className="tm-sidebar-brand-content">
        <div className="tm-sidebar-logo">
          <span className="material-symbols-outlined">task_alt</span>
        </div>
        <div>
          <div className="tm-sidebar-brand-title">{title}</div>
          {subtitle ? <div className="tm-sidebar-brand-subtitle">{subtitle}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function AppSidebarBody({ children, className = '' }) {
  return <div className={joinClassNames('tm-sidebar-body', className)}>{children}</div>;
}

export function AppSidebarProfile({ name, subtitle, avatarText, avatarName }) {
  const style = avatarName
    ? {
        backgroundImage: `url("https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=144bb8&color=fff")`,
      }
    : undefined;

  return (
    <div className="tm-profile-card">
      <div className="tm-profile-avatar" style={style}>{avatarText}</div>
      <div className="tm-profile-content">
        <div className="tm-profile-title">{name}</div>
        <div className="tm-profile-subtitle">{subtitle}</div>
      </div>
    </div>
  );
}

export function AppSidebarSectionLabel({ children }) {
  return <div className="tm-sidebar-section-label">{children}</div>;
}

export function AppSidebarDivider() {
  return <div className="tm-sidebar-divider" />;
}

export function AppPageHeader({ title, subtitle, actions, badge }) {
  return (
    <div className="tm-page-header">
      <div className="tm-page-header-copy">
        <div className="tm-page-title">
          <span>{title}</span>
          {badge ?? null}
        </div>
        {subtitle ? <p className="tm-page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="tm-page-header-actions">{actions}</div> : null}
    </div>
  );
}

export function AppControlBar({ children, className = '' }) {
  return <div className={joinClassNames('tm-control-bar', className)}>{children}</div>;
}

export function AppSearchField({
  value,
  onChange,
  placeholder = 'Search',
  ariaLabel = 'Search',
  className = '',
  inputClassName = '',
}) {
  return (
    <div className={joinClassNames('tm-search-field', className)}>
      <span className="material-symbols-outlined tm-search-icon" aria-hidden="true">search</span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={joinClassNames('tm-search-input', inputClassName)}
      />
    </div>
  );
}

export function AppSegmentedTabs({
  items,
  value,
  onChange,
  className = '',
  size = 'default',
  fullWidth = false,
}) {
  return (
    <div
      className={joinClassNames(
        'tm-segmented-tabs',
        size === 'compact' ? 'tm-segmented-tabs-compact' : '',
        fullWidth ? 'tm-segmented-tabs-full' : '',
        className
      )}
    >
      {items.map((item) => {
        const normalizedItem = normalizeTabItem(item);
        const isActive = normalizedItem.key === value;
        const hasBadge = normalizedItem.badge === 0 || Boolean(normalizedItem.badge);

        return (
          <button
            key={normalizedItem.key}
            type="button"
            onClick={() => onChange(normalizedItem.key)}
            className={joinClassNames('tm-segmented-tab', isActive ? 'tm-segmented-tab-active' : '')}
            aria-pressed={isActive}
          >
            {normalizedItem.icon ? (
              <span className="material-symbols-outlined tm-segmented-tab-icon" aria-hidden="true">
                {normalizedItem.icon}
              </span>
            ) : null}
            <span>{normalizedItem.label}</span>
            {hasBadge ? (
              <span className="tm-segmented-tab-badge">{normalizedItem.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function AppStatCard({ label, value, meta, icon, tone = 'accent' }) {
  const toneStyles = {
    accent: 'bg-[#144bb8]/10 text-[#144bb8]',
    success: 'bg-emerald-500/10 text-emerald-500',
    warning: 'bg-amber-500/10 text-amber-500',
    danger: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="bg-[#1c212c] p-5 rounded-xl border border-[#2d3544] shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-slate-400 text-sm font-medium">{label}</h3>
        {icon ? (
          <div className={`p-2 rounded-lg ${toneStyles[tone] || toneStyles.accent}`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl font-bold text-white">{value}</span>
        {meta ? <span className="text-xs text-slate-400 font-medium">{meta}</span> : null}
      </div>
    </div>
  );
}

export function AppSectionCard({ children, className = '' }) {
  return (
    <section className={joinClassNames('bg-[#1c212c] rounded-xl border border-[#2d3544] shadow-sm', className)}>
      {children}
    </section>
  );
}

export function AppEmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-slate-400 gap-4">
      <span className="material-symbols-outlined text-6xl text-slate-500">{icon}</span>
      <div>
        <p className="text-xl font-semibold text-white">{title}</p>
        <p className="text-sm mt-2 max-w-md">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}