import React, { ChangeEventHandler, useMemo } from 'react';
import { ACCOUNT_COPY, emailTopics } from '@CONSTANTS';
import { Col, Row, Form, Stack } from 'react-bootstrap';
import { ContinueBtn } from '@Components/buttons';
import { InfoTooltip } from '@Components/modals';
import SWITCHES from './switches';
import {
  useDevice,
  useProfile,
  type Settings,
  type EmailTopic,
} from '@Contexts';
import './style.css';

// Type for boolean-only settings (excludes unsubscribedFrom array)
type BooleanSettings = Omit<Settings, 'unsubscribedFrom'>;

type PreferencesProps = {
  settingsAreDefault: boolean;
  handleCheckbox: ChangeEventHandler;
  handleSwitch: ChangeEventHandler;
  handleClick: () => void;
};

const Preferences = ({
  settingsAreDefault,
  handleCheckbox,
  handleSwitch,
  handleClick,
}: PreferencesProps) => {
  const { isMobile } = useDevice(),
    { settings } = useProfile();

  // holds undefined value at boot
  const prevPreferences = useMemo(() => settings, [settings]);

  const switches = useMemo(
    () =>
      SWITCHES.map((setting) => (
        <Stack
          key={setting.tooltip.toolTipId + '-switch-group'}
          id={setting.tooltip.toolTipId + '-switch-group'}
          className={'align-items-baseline'}
          direction={'horizontal'}
          gap={isMobile ? 1 : 0}
        >
          <Form.Switch
            tabIndex={0}
            className={setting.cls + ' mx-lg-2 donation-filter-switch'}
            aria-pressed={
              settings[
                setting.tooltip.toolTipId as keyof BooleanSettings
              ] as boolean
            }
            checked={
              settings[
                setting.tooltip.toolTipId as keyof BooleanSettings
              ] as boolean
            }
            onChange={handleSwitch}
            {...setting}
          />
          {isMobile && <>&nbsp;</>}
          <InfoTooltip
            showToolTips={settings.showToolTips}
            {...setting.tooltip}
          />
        </Stack>
      )),
    [handleSwitch, isMobile, settings]
  );

  const checkboxes = useMemo(() => {
    return emailTopics.EMAIL_TOPICS_ARRAY.map((topicKey: string) => {
      const topicName =
        emailTopics.EMAIL_TOPIC_NAMES[
          topicKey as keyof typeof emailTopics.EMAIL_TOPIC_NAMES
        ];

      return (
        <Stack
          gap={1}
          direction={'horizontal'}
          id={topicName + '-checkbox'}
          key={topicName + '-checkbox'}
          className={'mt-lg-1 align-items-baseline'}
        >
          <Form.Check
            id={topicKey + '-checkbox'}
            label={topicName}
            type={'checkbox'}
            checked={
              !(settings.unsubscribedFrom || []).includes(
                topicKey as EmailTopic
              )
            }
            onChange={handleCheckbox}
          />

          <InfoTooltip
            toolTipId={topicKey + '-checkbox'}
            showToolTips={settings.showToolTips}
            message={
              ACCOUNT_COPY.SUB_TOOLTIPS[
                topicKey as keyof typeof ACCOUNT_COPY.SUB_TOOLTIPS
              ]
            }
            infoPlacement='auto'
            icon='question-circle settings-tooltip'
          />
        </Stack>
      );
    });
  }, [settings, handleCheckbox]);

  const resetDefaultLabel = (
    <span>
      <i className='bi bi-arrow-repeat' />
      &nbsp;Defaults
    </span>
  );

  return (
    prevPreferences && (
      <Form className='preferences'>
        <span className='settings-subpane fs-5'>Preferences</span>
        <Row className='flex-lg-column mt-lg-1'>
          <Col
            xs={'auto'}
            lg={12}
          >
            <Row>
              <Col>{switches}</Col>
            </Row>
          </Col>
          <h2 className={'mt-lg-3 mt-1 mb-2 mb-lg-2 fs-6'}>
            Alert Subscriptions
          </h2>
          <Col
            xs='auto'
            lg={12}
          >
            {checkboxes}
          </Col>
          <Col
            xs={1}
            lg={12}
            className={'reset-default mt-lg-3'}
          >
            {settingsAreDefault || (
              <ContinueBtn
                classProp={'reset-default-btn'}
                disabled={settingsAreDefault}
                size={isMobile ? 'sm' : 'lg'}
                variant={'outline-secondary'}
                handleClick={handleClick}
                label={resetDefaultLabel}
              />
            )}
          </Col>
        </Row>
      </Form>
    )
  );
};

export default React.memo(Preferences);
