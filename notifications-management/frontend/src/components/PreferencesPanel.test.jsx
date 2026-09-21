import { fireEvent, render, screen } from '@testing-library/react';
import PreferencesPanel from './PreferencesPanel';

const basePreferences = {
  emailEnabled: true,
  inAppEnabled: false,
  preferences: {
    task_assigned: { enabled: true },
  },
};

describe('PreferencesPanel', () => {
  it('renders open state and forwards toggle and save actions', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const onToggleGlobal = vi.fn();
    const onToggleType = vi.fn();

    render(
      <PreferencesPanel
        isOpen
        preferences={basePreferences}
        onClose={onClose}
        onSave={onSave}
        onToggleGlobal={onToggleGlobal}
        onToggleType={onToggleType}
      />
    );

    const toggles = screen.getAllByRole('checkbox');
    fireEvent.click(toggles[0]);
    fireEvent.click(toggles[2]);
    fireEvent.click(screen.getByText('Save Changes'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(onToggleGlobal).toHaveBeenCalledWith('emailEnabled');
    expect(onToggleType).toHaveBeenCalledWith('task_assigned');
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});