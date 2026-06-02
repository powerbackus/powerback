/**
 * Rally support actions — Tell the People, Take the Lead, Keep Watch.
 *
 * Portrait / narrow: three stacked sections with headings.
 * Tablet landscape+: left pill nav + single panel (CSS grid keeps panel height stable).
 *
 * @module Rally/subcomps/SupportActions
 */
import React from 'react';
import { Col, Form, Nav, Row, Spinner, Stack, Tab } from 'react-bootstrap';
import { SubmitBtn } from '@Components/buttons';
import type { StoredShareLink } from '@Utils';
import {
  type RallySharePlatform,
  type RallySupportTab,
  RALLY_SHARE_PLATFORMS,
  RALLY_SUPPORT_TABS,
  RALLY_COPY,
} from '@CONSTANTS';

/**
 * Button classes for Take the Lead / Keep Watch only.
 * Copy message keeps `rally--copy-btn rally--card-cta` as the visual reference.
 */
const RALLY_CARD_ACTION_BTN_CLASS = 'rally--card-action-btn rally--card-cta';

export type { RallySupportTab };

/**
 * Props for the clipboard row injected from Rally (RallyClipboardLine).
 */
type RallyClipboardLineProps = {
  value: string;
  className: string;
  copyLabel: string;
  onCopy: () => void;
};

/**
 * Props for SupportActions — state and handlers owned by Rally.tsx.
 *
 * @property copyText - Clipboard + GA; `target` is message, url, or claim
 * @property ClipboardLine - RallyClipboardLine component for link-ready rows
 * @property onSharePlatformChange - Platform select; resets template from registry
 * @property handleEmailSubmit - Form submit handler
 * @property onShareMessageChange - User edits; pauses auto template sync until link swap
 * @property setEmailError - Clears or sets email error
 * @property onSelectTab - Pill selection handler
 * @property setEmailSuccess - Clears or sets success state
 * @property storedLink - Persisted share URL + claim code after generate
 * @property setEmail - Email input controlled value setter
 * @property sharePlatform - Manual-share platform id for suggested message
 * @property markManualShareSeen - GA/session when user engages Tell the People
 * @property handleGenerateLink - Explicit create share link action
 * @property handleNativeShare - Native share sheet handler
 * @property generateError - User-visible generate failure (or null)
 * @property handleEmailFocus - Focus handler (analytics / clear errors)
 * @property activeTab - Selected pill when useTabsLayout
 * @property canUseNativeShare - Web Share API available
 * @property isEmailSubmitting - Rally subscriber POST in flight
 * @property emailError - Validation or API error message
 * @property useTabsLayout - True on tablet landscape (pill nav + single panel)
 * @property emailSuccess - Post-submit success (checkmark on button)
 * @property isGenerating - Share-link POST in flight
 * @property shareMessage - Editable manual-share post (copy / native share payload)
 * @property email - Keep Watch email field value
 */
export type SupportActionsProps = {
  copyText: (
    text: string,
    target: 'url' | 'claim' | 'message',
    options?: { platform?: RallySharePlatform; location?: string }
  ) => Promise<void>;
  ClipboardLine: React.ComponentType<RallyClipboardLineProps>;
  onSharePlatformChange: (platform: RallySharePlatform) => void;
  handleEmailSubmit: (e: React.FormEvent) => void;
  onShareMessageChange: (value: string) => void;
  setEmailError: (value: string | null) => void;
  onSelectTab: (tab: RallySupportTab) => void;
  setEmailSuccess: (value: boolean) => void;
  storedLink: StoredShareLink | null;
  setEmail: (value: string) => void;
  sharePlatform: RallySharePlatform;
  markManualShareSeen: () => void;
  handleGenerateLink: () => void;
  handleNativeShare: () => void;
  generateError: string | null;
  handleEmailFocus: () => void;
  activeTab: RallySupportTab;
  canUseNativeShare: boolean;
  isEmailSubmitting: boolean;
  emailError: string | null;
  useTabsLayout: boolean;
  emailSuccess: boolean;
  isGenerating: boolean;
  shareMessage: string;
  email: string;
};

/**
 * Tell the People panel — platform picker, suggested post, copy / native share.
 *
 * @param props - Subset of SupportActionsProps for manual share
 */
const TellThePeopleContent = ({
  onShareMessageChange,
  onSharePlatformChange,
  markManualShareSeen,
  canUseNativeShare,
  handleNativeShare,
  sharePlatform,
  shareMessage,
  copyText,
}: Pick<
  SupportActionsProps,
  | 'onShareMessageChange'
  | 'onSharePlatformChange'
  | 'markManualShareSeen'
  | 'canUseNativeShare'
  | 'handleNativeShare'
  | 'sharePlatform'
  | 'shareMessage'
  | 'copyText'
>) => (
  <>
    <p className={'rally--hint'}>{RALLY_COPY.MANUAL_SHARE.hint}</p>
    <Form.Group
      className={'rally--platform-field'}
      controlId={'rally-share-platform'}
    >
      <Form.Label className={'rally--platform-label'}>
        {RALLY_COPY.MANUAL_SHARE.platformLabel}
      </Form.Label>
      <Form.Select
        onChange={(e) =>
          onSharePlatformChange(e.target.value as RallySharePlatform)
        }
        aria-label={RALLY_COPY.MANUAL_SHARE.platformLabel}
        value={sharePlatform}
      >
        {RALLY_SHARE_PLATFORMS.map(({ id, label }) => (
          <option
            key={id}
            value={id}
          >
            {label}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
    <Form.Group
      className={'rally--suggested-message-block'}
      controlId={'rally-suggested-message'}
    >
      <Form.Label className={'rally--suggested-message-label'}>
        {RALLY_COPY.MANUAL_SHARE.suggestedMessageLabel}
      </Form.Label>
      <Form.Control
        aria-label={RALLY_COPY.MANUAL_SHARE.suggestedMessageLabel}
        onChange={(e) => onShareMessageChange(e.target.value)}
        className={'rally--suggested-message-input'}
        value={shareMessage}
        as={'textarea'}
        rows={3}
      />
    </Form.Group>
    <Stack
      className={'flex-wrap justify-content-center rally--btn-row'}
      direction={'horizontal'}
      gap={2}
    >
      <SubmitBtn
        classProp={'rally--copy-btn rally--card-cta'}
        value={RALLY_COPY.MANUAL_SHARE.copyMessage}
        onClick={() => {
          markManualShareSeen();
          void copyText(shareMessage, 'message', {
            platform: sharePlatform,
            location: 'manual',
          });
        }}
        btnId={'rally-copy-message'}
        variant={'outline-dark'}
        type={'button'}
      />
      {canUseNativeShare && (
        <SubmitBtn
          value={RALLY_COPY.MANUAL_SHARE.nativeShare}
          onClick={() => void handleNativeShare()}
          classProp={'rally--copy-btn'}
          btnId={'rally-native-share'}
          variant={'outline-dark'}
          type={'button'}
        />
      )}
    </Stack>
  </>
);

/**
 * Take the Lead panel — generate share link or show compact link + claim rows.
 *
 * @param props - Subset of SupportActionsProps for anonymous link flow
 */
const TakeTheLeadContent = ({
  handleGenerateLink,
  copyText,
  ClipboardLine,
  generateError,
  isGenerating,
  storedLink,
}: Pick<
  SupportActionsProps,
  | 'handleGenerateLink'
  | 'copyText'
  | 'ClipboardLine'
  | 'generateError'
  | 'isGenerating'
  | 'storedLink'
>) =>
  !storedLink ? (
    <div className={'rally--lead-panel'}>
      <section
        className={'rally--lead-intro'}
        aria-labelledby={'rally-lead-intro'}
      >
        <p
          id={'rally-lead-intro'}
          className={'rally--hint'}
        >
          {RALLY_COPY.ANONYMOUS_LINK.explain}
        </p>
      </section>
      <section
        className={'rally--lead-action'}
        aria-label={RALLY_COPY.ANONYMOUS_LINK.generate}
      >
        <SubmitBtn
          onClick={() => void handleGenerateLink()}
          classProp={RALLY_CARD_ACTION_BTN_CLASS}
          value={
            isGenerating
              ? RALLY_COPY.ANONYMOUS_LINK.generating
              : RALLY_COPY.ANONYMOUS_LINK.generate
          }
          btnId={'rally-generate-share-link'}
          variant={'outline-dark'}
          disabled={isGenerating}
          type={'button'}
        />
        <div className={'rally--feedback-slot'}>
          <div
            className={`invalid-feedback d-block${
              generateError ? '' : ' rally--feedback-hidden'
            }`}
            role={generateError ? 'alert' : undefined}
            aria-hidden={!generateError}
          >
            {generateError || RALLY_COPY.ANONYMOUS_LINK.rateLimit}
          </div>
        </div>
      </section>
      <section
        className={'rally--lead-how'}
        aria-labelledby={'rally-lead-how-title'}
      >
        <h3
          id={'rally-lead-how-title'}
          className={'rally--lead-how-title'}
        >
          {RALLY_COPY.ANONYMOUS_LINK.howItWorksTitle}
        </h3>
        <ol className={'rally--lead-how-steps'}>
          {RALLY_COPY.ANONYMOUS_LINK.howItWorksSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  ) : (
    <div className={'rally--link-ready'}>
      <p className={'rally--link-ready-title'}>
        {RALLY_COPY.ANONYMOUS_LINK.readyTitle}
      </p>
      <div className={'rally--link-compact-row'}>
        <span className={'rally--link-compact-label'}>
          {RALLY_COPY.ANONYMOUS_LINK.linkLabel}
        </span>
        <ClipboardLine
          value={storedLink.shareUrl}
          className={'rally--share-url rally--link-compact-value'}
          copyLabel={RALLY_COPY.ANONYMOUS_LINK.copyUrl}
          onCopy={() =>
            void copyText(storedLink.shareUrl, 'url', {
              location: 'anonymous',
            })
          }
        />
      </div>
      <div className='rally--link-compact-row'>
        <span className='rally--link-compact-label'>
          {RALLY_COPY.ANONYMOUS_LINK.claimLabel}
        </span>
        <ClipboardLine
          value={storedLink.claimCode}
          className={'rally--claim-display rally--link-compact-value'}
          copyLabel={RALLY_COPY.ANONYMOUS_LINK.copyClaim}
          onCopy={() =>
            void copyText(storedLink.claimCode, 'claim', {
              location: 'anonymous',
            })
          }
        />
      </div>
      <p className={'rally--claim-helper'}>
        {RALLY_COPY.ANONYMOUS_LINK.claimHelper}
      </p>
    </div>
  );

/**
 * Keep Watch panel — movement email signup with inline validation.
 *
 * @param props - Subset of SupportActionsProps for rally subscriber form
 */
const KeepWatchContent = ({
  handleEmailSubmit,
  isEmailSubmitting,
  handleEmailFocus,
  setEmailSuccess,
  setEmailError,
  emailSuccess,
  emailError,
  setEmail,
  email,
}: Pick<
  SupportActionsProps,
  | 'handleEmailSubmit'
  | 'isEmailSubmitting'
  | 'handleEmailFocus'
  | 'setEmailSuccess'
  | 'setEmailError'
  | 'emailSuccess'
  | 'emailError'
  | 'setEmail'
  | 'email'
>) => (
  <>
    <p className={'rally--section-kicker mt-lg-1'}>{RALLY_COPY.EMAIL.kicker}</p>
    <p className={'rally--hint mt-lg-4'}>{RALLY_COPY.EMAIL.hint}</p>
    <Form
      onSubmit={handleEmailSubmit}
      className={'rally--email-form'}
    >
      <Form.Group
        className={'form-input-wfeedback rally--email-field input--translucent'}
      >
        <Form.Control
          placeholder={RALLY_COPY.EMAIL.placeholder}
          aria-describedby={'rally-email-error'}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) {
              setEmailError(null);
            }
            if (emailSuccess) {
              setEmailSuccess(false);
            }
          }}
          onFocus={handleEmailFocus}
          isInvalid={!!emailError}
          autoComplete={'email'}
          name={'rally-email'}
          value={email}
          type={'email'}
        />
        {/* Placeholder reserves height for longest error string (see rally--feedback-slot) */}
        <div className={'rally--feedback-slot'}>
          <div
            className={`invalid-feedback d-block${
              emailError ? '' : ' rally--feedback-hidden'
            }`}
            id='rally-email-error'
            role={emailError ? 'alert' : undefined}
            aria-hidden={!emailError}
          >
            {emailError || RALLY_COPY.EMAIL.rateLimit}
          </div>
        </div>
      </Form.Group>
      <SubmitBtn
        classProp={`rally--email-submit ${RALLY_CARD_ACTION_BTN_CLASS}`}
        value={
          <span className={'rally--email-submit-inner'}>
            <span
              className={`rally--email-submit-label${
                emailSuccess || isEmailSubmitting
                  ? ' rally--email-submit-label--reserve'
                  : ''
              }`}
              aria-hidden={emailSuccess || isEmailSubmitting}
            >
              {RALLY_COPY.EMAIL.submit}
            </span>
            {isEmailSubmitting ? (
              <Spinner
                role={'status'}
                animation={'border'}
                className={'rally--email-submit-spinner'}
                size={'sm'}
              >
                <span className={'visually-hidden'}>
                  {RALLY_COPY.EMAIL.submitting}
                </span>
              </Spinner>
            ) : null}
            {emailSuccess ? (
              <i
                className={'bi bi-check-lg rally--email-submit-check'}
                aria-hidden
              />
            ) : null}
          </span>
        }
        disabled={isEmailSubmitting || emailSuccess}
        ariaLabel={
          emailSuccess
            ? RALLY_COPY.EMAIL.submitSuccess
            : isEmailSubmitting
              ? RALLY_COPY.EMAIL.submitting
              : RALLY_COPY.EMAIL.submit
        }
        btnId={'rally-email-submit'}
        variant={'outline-dark'}
        type={'submit'}
      />
      <div className={'rally--email-status-slot'}>
        <p
          className={`rally--email-success${
            emailSuccess ? '' : ' rally--feedback-hidden'
          }`}
          role={emailSuccess ? 'status' : undefined}
          aria-hidden={!emailSuccess}
        >
          {RALLY_COPY.EMAIL.success}
        </p>
      </div>
    </Form>
  </>
);

/**
 * SupportActions component
 *
 * Renders optional support paths (not required before Lobby). Parent supplies
 * share-link, email, and copy handlers from Rally.tsx.
 *
 * @param props - SupportActionsProps
 * @returns Stacked sections or pill + tab panel layout
 */
const SupportActions = (props: SupportActionsProps) => {
  const {
    markManualShareSeen,
    ClipboardLine,
    useTabsLayout,
    onSelectTab,
    activeTab,
  } = props;

  const tell = <TellThePeopleContent {...props} />;
  const lead = (
    <TakeTheLeadContent
      {...props}
      ClipboardLine={ClipboardLine}
    />
  );
  const watch = <KeepWatchContent {...props} />;

  if (useTabsLayout) {
    return (
      <div className={'rally--actions-tabs'}>
        <Tab.Container
          activeKey={activeTab}
          // All panes stay mounted; CSS grid uses max pane height (see rally--support-panel)
          unmountOnExit={false}
          transition={false}
          onSelect={(key) => {
            if (key === 'tell' || key === 'lead' || key === 'watch') {
              if (key === 'tell') {
                markManualShareSeen();
              }
              onSelectTab(key);
            }
          }}
        >
          <Row className={'rally--support-tab-row g-3'}>
            <Col
              className={'rally--support-nav-col'}
              xs={12}
              lg={4}
            >
              <div className={'rally--support-nav-stack'}>
                <div className={'rally--support-selector-label'}>
                  <p className={'rally--support-selector-lead'}>
                    {RALLY_COPY.SUPPORT_ACTIONS.selectorLead}
                  </p>
                  <p className={'rally--support-selector-sub'}>
                    {RALLY_COPY.SUPPORT_ACTIONS.selectorSub}
                  </p>
                </div>
                <Nav
                  aria-label={RALLY_COPY.SUPPORT_ACTIONS.tabsAriaLabel}
                  className={'flex-column rally--support-nav'}
                  variant={'pills'}
                  role={'tablist'}
                >
                  {RALLY_SUPPORT_TABS.map(({ key, title, definition }) => (
                    <Nav.Item key={key}>
                      <Nav.Link
                        eventKey={key}
                        className={'rally--support-nav-link'}
                      >
                        <span className={'rally--support-nav-copy'}>
                          <span className={'rally--support-nav-title'}>
                            {title}
                          </span>
                          <span className={'rally--support-nav-def'}>
                            {definition}
                          </span>
                        </span>
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
              </div>
            </Col>
            <Col
              xs={12}
              lg={8}
              className={'rally--support-panel-col'}
            >
              <div className={'rally--support-panel rally--section'}>
                <Tab.Content>
                  {[
                    {
                      key: 'tell',
                      content: tell,
                      className: 'rally--support-pane',
                    },
                    {
                      key: 'lead',
                      content: lead,
                      className:
                        'rally--support-pane rally--support-pane--lead',
                    },
                    {
                      key: 'watch',
                      content: watch,
                      className:
                        'rally--support-pane rally--support-pane--watch',
                    },
                  ].map(({ key, className, content }) => (
                    <Tab.Pane
                      key={key}
                      className={className}
                      mountOnEnter={false}
                      eventKey={key}
                    >
                      {content}
                    </Tab.Pane>
                  ))}
                </Tab.Content>
              </div>
            </Col>
          </Row>
        </Tab.Container>
      </div>
    );
  }

  return (
    <div className='rally--actions-row'>
      <section
        className={'rally--section rally--card--tell'}
        aria-labelledby={'rally-manual-title'}
        onMouseEnter={markManualShareSeen}
        onFocus={markManualShareSeen}
      >
        <h2
          id={'rally-manual-title'}
          className={'rally--section-title'}
        >
          {RALLY_COPY.MANUAL_SHARE.title}
        </h2>
        {tell}
      </section>

      <section
        className={'rally--section rally--anonymous-link rally--card--lead'}
        aria-labelledby={'rally-link-title'}
      >
        <h2
          id={'rally-link-title'}
          className={'rally--section-title'}
        >
          {RALLY_COPY.ANONYMOUS_LINK.title}
        </h2>
        {lead}
      </section>

      <section
        className={'rally--section rally--email rally--card--follow'}
        aria-labelledby={'rally-email-title'}
      >
        <h2
          id={'rally-email-title'}
          className={'rally--section-title'}
        >
          {RALLY_COPY.EMAIL.title}
        </h2>
        {watch}
      </section>
    </div>
  );
};

export default React.memo(SupportActions);
