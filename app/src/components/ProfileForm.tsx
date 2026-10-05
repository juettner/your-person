/**
 * The partner questionnaire as a short stack of index cards.
 *
 *   Card 1          name, interests, "lately"
 *   Card 2..N       one per selected interest, with that interest's follow-ups
 *                   ("Which sport?" -> "Which team?"), as served by the API
 *
 * Used by onboarding (empty, must walk every card) and the profile screen
 * (pre-filled; can save from the first card or walk the cards to edit details).
 *
 * Form state is plain `useState`. The whole thing is one component because the
 * cards share state; splitting it would mean lifting that state right back up.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FollowUpFields } from '@/components/FollowUpFields';
import { InterestChips } from '@/components/InterestChips';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { api, describeError, Interest, InterestDetails, ProfileInput } from '@/lib/api';

interface ProfileFormProps {
  initial?: ProfileInput;
  /** Label on the final card's button ("Deal me in", "Save"). */
  submitLabel: string;
  /** Called with the cleaned-up values. Throw to show an error; resolve to finish. */
  onSubmit: (values: ProfileInput) => Promise<void>;
  /** `create` walks every card; `edit` can save from the first card. */
  mode: 'create' | 'edit';
  /** Title for the first card. Deeper cards are titled by their interest. */
  title: string;
  /** Rendered above the first card only (back link, theme picker). */
  header?: ReactNode;
  /** Rendered under the buttons on the first card only. */
  footer?: ReactNode;
}

export function ProfileForm({ initial, submitLabel, onSubmit, mode, title, header, footer }: ProfileFormProps) {
  const p = usePalette();

  const [name, setName] = useState(initial?.name ?? '');
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [currentFocus, setCurrentFocus] = useState(initial?.currentFocus ?? '');
  const [details, setDetails] = useState<InterestDetails>(initial?.interestDetails ?? {});
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

  // The deeper cards: selected interests that have follow-ups, in taxonomy order.
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
      await onSubmit({
        name: name.trim(),
        interests,
        interestDetails: details,
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

  const inputStyle = [styles.input, { color: p.ink, borderColor: p.ink, backgroundColor: p.card }];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 0 && header}

        {/* Step chip + title. The chip doubles as the progress indicator. */}
        <View style={styles.titleBlock}>
          <View style={[styles.stepChip, { backgroundColor: p.accent }]}>
            <Text style={[styles.stepText, { color: p.onAccent }]}>
              {`STEP ${step + 1} OF ${totalSteps} · ${(current ? current.label : 'Your person').toUpperCase()}`}
            </Text>
          </View>
          <Text style={[styles.title, { color: p.onGround }]} accessibilityRole="header">
            {current ? `${current.label}.` : title}
          </Text>
        </View>

        {current ? (
          <Card contentStyle={styles.card}>
            <FollowUpFields
              interest={current}
              answers={details[current.id] ?? {}}
              onChange={(answers) => setDetails((d) => ({ ...d, [current.id]: answers }))}
            />
          </Card>
        ) : (
          <Card contentStyle={styles.card}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: p.ink }]}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Sam"
                placeholderTextColor={p.muted}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={60}
                style={inputStyle}
                accessibilityLabel="Their name"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: p.ink }]}>Into</Text>
              {options ? (
                <InterestChips interests={options} selected={interests} onChange={setInterests} />
              ) : loadError ? (
                <Text style={[styles.error, { color: p.ink }]}>{loadError}</Text>
              ) : (
                <ActivityIndicator color={p.ink} />
              )}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: p.ink }]}>Lately</Text>
              <TextInput
                value={currentFocus}
                onChangeText={setCurrentFocus}
                placeholder="What's going on in their world right now?"
                placeholderTextColor={p.muted}
                multiline
                maxLength={500}
                style={[...inputStyle, styles.multiline]}
                accessibilityLabel="What is going on in their world lately"
              />
            </View>
          </Card>
        )}

        {submitError && <Text style={[styles.error, { color: p.danger }]}>{submitError}</Text>}

        <View style={styles.actions}>
          {/* Edit mode, first card: save right away, or walk into the details. */}
          {mode === 'edit' && step === 0 ? (
            <>
              <Button title={submitLabel} onPress={submit} disabled={!canSubmit} busy={submitting} />
              {detailSteps.length > 0 && (
                <Button title="Edit details" variant="outline" onPress={() => setStep(1)} disabled={submitting} />
              )}
            </>
          ) : (
            <Button
              title={isLast ? submitLabel : 'Next'}
              onPress={next}
              disabled={!canSubmit}
              busy={submitting}
              accessibilityLabel={isLast ? submitLabel : `Next, step ${step + 2} of ${totalSteps}`}
            />
          )}
          {step > 0 && <Button title="Back" variant="link" onPress={back} disabled={submitting} style={styles.centerLink} />}
          {step === 0 && footer}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    gap: Spacing.md + 2,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    // Leave room on the right for the card's hard shadow.
    paddingRight: 6,
  },
  titleBlock: {
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  stepChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  stepText: {
    fontFamily: Fonts.extraBold,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg - 4,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  input: {
    fontFamily: Fonts.medium,
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderRadius: Radius.md,
  },
  multiline: {
    minHeight: 88,
    lineHeight: 22,
    textAlignVertical: 'top', // Android: start typing at the top, not vertically centred
  },
  error: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  centerLink: {
    alignSelf: 'center',
  },
});
