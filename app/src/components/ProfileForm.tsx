/**
 * The partner questionnaire. Used by both onboarding (empty) and the profile
 * screen (pre-filled). Three fields on purpose; simplicity is the feature.
 *
 * Form state is plain `useState`. For a three-field form a form library would
 * be more code than it saves.
 */
import { useEffect, useState } from 'react';
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
import { InterestChips } from '@/components/InterestChips';
import { Radius, Spacing, usePalette } from '@/constants/theme';
import { api, describeError, Interest, ProfileInput } from '@/lib/api';

interface ProfileFormProps {
  initial?: ProfileInput;
  submitLabel: string;
  /** Called with the cleaned-up values. Throw to show an error; resolve to finish. */
  onSubmit: (values: ProfileInput) => Promise<void>;
  /** Optional extra content under the submit button (links, secondary actions). */
  footer?: React.ReactNode;
}

export function ProfileForm({ initial, submitLabel, onSubmit, footer }: ProfileFormProps) {
  const palette = usePalette();

  const [name, setName] = useState(initial?.name ?? '');
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [currentFocus, setCurrentFocus] = useState(initial?.currentFocus ?? '');

  const [options, setOptions] = useState<Interest[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // useEffect runs after render. An empty dependency array means "once, on mount",
  // which is where data loading goes. Spring analogy: @PostConstruct.
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
    // The cleanup function runs if the component unmounts before the fetch finishes.
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = name.trim().length > 0 && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        name: name.trim(),
        interests,
        currentFocus: currentFocus.trim() || undefined,
      });
    } catch (err) {
      setSubmitError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = [
    styles.input,
    { color: palette.text, borderColor: palette.border, backgroundColor: palette.card },
  ];

  return (
    // On iOS the keyboard covers the bottom of the screen; this view shrinks to make room.
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: palette.text }]}>What do you call them?</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Sam"
          placeholderTextColor={palette.muted}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={60}
          style={inputStyle}
          accessibilityLabel="Their name"
        />

        <Text style={[styles.label, { color: palette.text }]}>What are they into?</Text>
        {options ? (
          <InterestChips interests={options} selected={interests} onChange={setInterests} />
        ) : loadError ? (
          <Text style={{ color: palette.danger }}>{loadError}</Text>
        ) : (
          <ActivityIndicator color={palette.accent} />
        )}

        <Text style={[styles.label, { color: palette.text }]}>
          What&apos;s going on in their world lately?
        </Text>
        <TextInput
          value={currentFocus}
          onChangeText={setCurrentFocus}
          placeholder="Big project at work, training for a 10k, the kitchen remodel..."
          placeholderTextColor={palette.muted}
          multiline
          maxLength={500}
          style={[...inputStyle, styles.multiline]}
          accessibilityLabel="What is going on in their world lately"
        />

        {submitError && <Text style={{ color: palette.danger }}>{submitError}</Text>}

        <View style={styles.actions}>
          <Button title={submitLabel} onPress={submit} disabled={!canSubmit} busy={submitting} />
          {footer}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  input: {
    fontSize: 17,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top', // Android: start typing at the top, not vertically centred
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
