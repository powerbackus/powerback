import React, {
  useRef,
  useMemo,
  useEffect,
  useCallback,
  useDeferredValue,
  type Dispatch,
  type ChangeEvent,
  type SetStateAction,
  type ChangeEventHandler,
} from 'react';
import { useAuth, useProfile, type EmailTopic, type Settings } from '@Contexts';
import { Col, Row, Tab } from 'react-bootstrap';
import type { ProfileProp } from '@Types';
import Preferences from './Preferences';
import Security from './Security';
import { INIT } from '@CONSTANTS';
import API from '@API';
import { logError } from '@Utils';
import './style.css';

const SettingsPane = ({ handleUpdateUser, ...props }: ProfileProp) => {
  const { settings, setSettings } = useProfile(),
    { userData: user } = useAuth();

  const init = INIT.initialSettings;

  // debounce prevents infinite loop caused by overclicking
  const deferredSettings = useDeferredValue(settings);

  const settingsAreDefault = useMemo(() => {
    return Object.keys(deferredSettings as Settings).every((key) => {
      if (!Object.keys(init).includes(key as string)) return false;

      const currentValue = (deferredSettings as Settings)[
        key as keyof Settings
      ];
      const defaultValue = init[key as keyof Settings];

      // Handle array comparison (for unsubscribedFrom)
      if (Array.isArray(currentValue) && Array.isArray(defaultValue)) {
        return (
          currentValue.length === defaultValue.length &&
          currentValue.every((val, idx) => val === defaultValue[idx])
        );
      }

      // Handle primitive comparison
      return currentValue === defaultValue;
    });
  }, [init, deferredSettings]);

  const handleClickRestoreDefaultSettings = useCallback(() => {
    if (settingsAreDefault) return;
    else (setSettings as Dispatch<SetStateAction<Settings>>)(init);
  }, [init, settingsAreDefault, setSettings]);

  const handleSettingsToggleSwitch = useCallback<ChangeEventHandler>(
    (e: ChangeEvent) => {
      const target: HTMLElement | null = (e.target.parentElement as HTMLElement)
          .parentElement,
        trimLength = (target as HTMLElement).id.length - 13,
        switchId = (target as HTMLElement).id.substring(0, trimLength);

      (setSettings as Dispatch<SetStateAction<Settings>>)((s) => ({
        ...s,
        [switchId]: !s[switchId as keyof Settings],
      }));
    },
    [setSettings]
  );

  const handleCheckboxToggle = useCallback<ChangeEventHandler>(
    (e: ChangeEvent<HTMLInputElement>) => {
      const topic = e.target.id.replace('-checkbox', '') as EmailTopic;
      const isChecked = e.target.checked;

      (setSettings as Dispatch<SetStateAction<Settings>>)((s) => {
        const currentUnsubscribed = s.unsubscribedFrom || [];

        if (isChecked) {
          // Remove from array (resubscribe)
          return {
            ...s,
            unsubscribedFrom: currentUnsubscribed.filter((t) => t !== topic),
          };
        } else {
          // Add to array (unsubscribe)
          return {
            ...s,
            unsubscribedFrom: [...currentUnsubscribed, topic],
          };
        }
      });
    },
    [setSettings]
  );

  // Track last settings sent to backend to avoid duplicate updates
  const lastSentSettingsRef = useRef<string>('');

  // Sync settings changes to backend
  useEffect(() => {
    if (!user?.id || !deferredSettings) return;

    // Compare stringified settings to detect actual changes
    const settingsString = JSON.stringify(deferredSettings);
    if (lastSentSettingsRef.current === settingsString) return;

    lastSentSettingsRef.current = settingsString;

    // Use dedicated settings API endpoint
    // Don't update userData after response - settings are already in state
    // Updating userData would trigger ProfileContext to sync settings back, causing a loop
    API.updateSettings(user.id, {
      settings: deferredSettings as Settings,
    }).catch((error) => {
      logError('Settings update failed', error);
    });
  }, [deferredSettings, user]);

  return (
    <Tab.Pane
      eventKey={'Settings'}
      unmountOnExit={false}
      className={'settings-pane text-center'}
    >
      <Row className={'pt-lg-3 mt-lg-1 px-4'}>
        <Col
          className={'px-4 pb-lg-3'}
          xs={12}
          lg={6}
        >
          <Preferences
            settingsAreDefault={settingsAreDefault}
            handleCheckbox={handleCheckboxToggle}
            handleSwitch={handleSettingsToggleSwitch}
            handleClick={handleClickRestoreDefaultSettings}
          />
        </Col>
        <Col
          xs={12}
          lg={6}
        >
          <Security
            handleUpdateUser={handleUpdateUser}
            {...props}
          />
        </Col>
      </Row>
    </Tab.Pane>
  );
};

export default React.memo(SettingsPane);
