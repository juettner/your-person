/**
 * The partner questionnaire on an index card. Used by onboarding (empty) and
 * the profile screen (pre-filled). Three fields on purpose.
 *
 * Form state is plain `useState`. For a three-field form a form library would
 * be more code than it saves.
 */
import { useEffect, useState, type ReactNode } from 'react';
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
import { InterestChips } from '@/components/InterestChips';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { api, describeError, Interest, ProfileInput } from '@/lib/api';

interface ProfileFormProps {
  initial?: ProfileInput;
  submitLabel: string;
  /** Called with the cleaned-up values. Throw to show an error; resolve to finish. */
  onSubmit: (values: ProfileInput) => Promise<void>;
  /** Rendered above the card, inside the scroll area (titles, the theme picker). */
  header?: ReactNode;
  /** Rendered under the submit button. */
  footer?: ReactNode;
}

export function ProfileForm({ initial, submitLabel, onSubmit, header, footer }: ProfileFormProps) {
  const p = usePalette();

  const [name, setName] = useState(initial?.name ?? '');
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [currentFocus, setCurrentFocus] = useState(initial?.currentFocus ?? '');

  const [options, setOptions] = useState<Interest[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Runs once after the first render: load the chips. Spring analogy: @PostConstruct.
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

  const canSubmit = name.trim().length > 0 && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({ name: name.trim(), interests, currentFocus: currentFocus.trim() || undefined });
    } catch (err) {
      setSubmitError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = [styles.input, { color: p.ink, borderColor: p.ink, backgroundColor: p.card }];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {header}

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
              <Text style={[styles.error, { color: p.danger === '#FFE1DB' ? p.ink : p.danger }]}>{loadError}</Text>
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

        {submitError && <Text style={[styles.error, { color: p.danger }]}>{submitError}</Text>}

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
    gap: Spacing.md + 2,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    // Leave room on the right for the card's hard shadow.
    paddingRight: 6,
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
});
