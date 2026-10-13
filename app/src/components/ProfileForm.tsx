/**
 * The partner questionnaire as a few pages of handwriting.
 *
 *   Page 1          name, interests, "lately"
 *   Page 2..N       one per selected interest, with that interest's follow-ups
 *                   ("which sport?" -> "which team?"), as served by the API
 *
 * Used by onboarding (empty, must walk every page) and the profile screen
 * (pre-filled; can save from the first page or walk the pages to edit details).
 *
 * Form state is plain `useState`. The whole thing is one component because the
 * pages share state; splitting it would mean lifting that state right back up.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { FollowUpFields } from '@/components/FollowUpFields';
import { Hand } from '@/components/Hand';
import { HandInput } from '@/components/HandInput';
import { usePalette } from '@/components/ThemeProvider';
import { Thinking } from '@/components/Thinking';
import { Word } from '@/components/Word';
import { WordChoice } from '@/components/WordChoice';
import { HandSize, Spacing } from '@/constants/theme';
import { Handwriting } from '@/handwriting/Handwriting';
import { api, describeError, Interest, InterestDetails, ProfileInput, ProfileLocation } from '@/lib/api';
import { detectLocation } from '@/lib/location';

/** How many follow-ups per interest the onboarding pages show. */
const ONBOARDING_FOLLOW_UPS = 2;
/** How many interests show before "+n more". */
const VISIBLE_INTERESTS = 12;

interface ProfileFormProps {
  initial?: ProfileInput;
  /** Label on the final page's action ("deal me in", "save"). */
  submitLabel: string;
  /** Called with the cleaned-up values. Throw to show an error; resolve to finish. */
  onSubmit: (values: ProfileInput) => Promise<void>;
  /** `create` walks every page; `edit` can save from the first page. */
  mode: 'create' | 'edit';
  /** Title for the first page. Deeper pages are titled by their interest. */
  title: string;
  /** Rendered above the first page only (back link, paper picker). */
  header?: ReactNode;
  /** Rendered under the actions on the first page only. */
  footer?: ReactNode;
  /** Rendered between the first page's fields and its actions (dates, reminders). */
  afterCard?: ReactNode;
}

export function ProfileForm({ initial, submitLabel, onSubmit, mode, title, header, footer, afterCard }: ProfileFormProps) {
  const p = usePalette();

  const [name, setName] = useState(initial?.name ?? '');
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [currentFocus, setCurrentFocus] = useState(initial?.currentFocus ?? '');
  const [details, setDetails] = useState<InterestDetails>(initial?.interestDetails ?? {});
  // Location is kept as a place name. `city` is what the user sees and edits;
  // region/country ride along from "use my location" when available.
  const [location, setLocation] = useState<ProfileLocation | null>(initial?.location ?? null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const [options, setOptions] = useState<Interest[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Runs once after the first render: load the taxonomy. Spring analogy: @PostConstruct.
  useEffect(() => {
    let cancelled = false;
    api
      .listInterests()
      .then((list) => {
        if (!cancelled) setOptions(list);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(describeError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The deeper pages: selected interests that have follow-ups, in taxonomy order.
  // useMemo recomputes only when its inputs change.
  const detailSteps = useMemo(
    () => (options ?? []).filter((i) => interests.includes(i.id) && i.followUps.length > 0),
    [options, interests],
  );
  const totalSteps = 1 + detailSteps.length;
  const isLast = step >= totalSteps - 1;
  const current = step > 0 ? detailSteps[step - 1] : null;

  const canSubmit = name.trim().length > 0 && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const city = location?.city.trim();
      await onSubmit({
        name: name.trim(),
        interests,
        interestDetails: details,
        // An empty city clears the location; the API treats null as "remove".
        location: city ? { ...location, city } : null,
        currentFocus: currentFocus.trim() || undefined,
      });
    } catch (err) {
      setSubmitError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => (isLast ? submit() : setStep((s) => s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const useMyLocation = async () => {
    setLocating(true);
    setLocationNote(null);
    const result = await detectLocation();
    if (result.status === 'ok') {
      setLocation(result.location);
    } else if (result.status === 'denied') {
      setLocationNote('location permission was turned down. you can write the city instead.');
    } else {
      setLocationNote("couldn't work out a city here. write it in instead.");
    }
    setLocating(false);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 0 && header}

        {/* Page number and title. The title writes itself each time the page changes. */}
        <View style={styles.titleBlock}>
          {totalSteps > 1 && (
            <Hand size="small" tone="muted">
              {`${step + 1} of ${totalSteps}`}
            </Hand>
          )}
          <Handwriting key={step} text={current ? `${current.label.toLowerCase()}.` : title} color={p.ink} size={HandSize.title} />
        </View>

        {current ? (
          <View style={styles.fields}>
            <FollowUpFields
              // Keep onboarding short: the first two follow-ups now, the rest from the profile screen.
              interest={mode === 'create' ? { ...current, followUps: current.followUps.slice(0, ONBOARDING_FOLLOW_UPS) } : current}
              answers={details[current.id] ?? {}}
              onChange={(answers) => setDetails((d) => ({ ...d, [current.id]: answers }))}
            />
            {mode === 'create' && current.followUps.length > ONBOARDING_FOLLOW_UPS && (
              <Hand size="small" tone="muted">
                {current.followUps.length - ONBOARDING_FOLLOW_UPS} more on the profile page, whenever.
              </Hand>
            )}
          </View>
        ) : (
          <View style={styles.fields}>
            <View style={styles.field}>
              <Hand size="small" tone="muted">
                name
              </Hand>
              <HandInput
                value={name}
                onChangeText={setName}
                placeholder="sam"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={60}
                accessibilityLabel="Their name"
              />
            </View>

            <View style={styles.field}>
              <Hand size="small" tone="muted">
                where they live
              </Hand>
              <HandInput
                value={location?.city ?? ''}
                // Typing replaces any detected region/country: we can't trust them for a new city.
                onChangeText={(city) => setLocation(city ? { city } : null)}
                placeholder="minneapolis"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={80}
                accessibilityLabel="Where they live"
              />
              <View style={styles.inlineRow}>
                <Word title={locating ? 'finding you...' : 'use my location'} variant="quiet" size="small" onPress={useMyLocation} disabled={locating} />
                {location?.region ? (
                  <Hand size="small" tone="muted">
                    {[location.region, location.country].filter(Boolean).join(', ').toLowerCase()}
                  </Hand>
                ) : null}
              </View>
              {locationNote && (
                <Hand size="small" tone="muted">
                  {locationNote}
                </Hand>
              )}
            </View>

            <View style={styles.field}>
              <Hand size="small" tone="muted">
                into
              </Hand>
              {options ? (
                <WordChoice
                  options={options.map((o) => ({ id: o.id, label: o.label.toLowerCase() }))}
                  selected={interests}
                  multi
                  limit={VISIBLE_INTERESTS}
                  onChange={setInterests}
                />
              ) : loadError ? (
                <Hand tone="muted">{loadError}</Hand>
              ) : (
                <Thinking />
              )}
            </View>

            <View style={styles.field}>
              <Hand size="small" tone="muted">
                lately
              </Hand>
              <HandInput
                value={currentFocus}
                onChangeText={setCurrentFocus}
                placeholder="what's going on in their world right now?"
                multiline
                maxLength={500}
                accessibilityLabel="What is going on in their world lately"
              />
            </View>
          </View>
        )}

        {step === 0 && afterCard}

        {submitError && <Hand tone="muted">{submitError}</Hand>}

        <View style={styles.actions}>
          {/* Edit mode, first page: save right away, or walk into the details. */}
          {mode === 'edit' && step === 0 ? (
            <>
              <Word title={submitLabel} weight="medium" onPress={submit} disabled={!canSubmit} busy={submitting} />
              {detailSteps.length > 0 && <Word title="edit details" onPress={() => setStep(1)} disabled={submitting} />}
            </>
          ) : (
            <Word
              title={isLast ? submitLabel : 'next'}
              weight="medium"
              onPress={next}
              disabled={!canSubmit}
              busy={submitting}
              accessibilityLabel={isLast ? submitLabel : `Next, page ${step + 2} of ${totalSteps}`}
            />
          )}
          {step > 0 && <Word title="back" variant="quiet" size="small" onPress={back} disabled={submitting} />}
        </View>
        {step === 0 && footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  titleBlock: {
    gap: Spacing.xs,
  },
  fields: {
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.xs,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
});
