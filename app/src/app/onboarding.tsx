/**
 * First run: a few pages of a journal, one question per page.
 *
 *   What do you call them?            a line to write their name on
 *   Where do they live?               a line, and "use my location"
 *   What are they into?               the list; tap to circle
 *   Which cuisines do they reach for? one page per follow-up, two per interest
 *   ...
 *   What's going on in their world lately?
 *
 * Turn the page (the fold, or swipe left) to go on; swipe right or tap
 * "back" to go back. The last page's fold starts the journal.
 *
 * The pages are computed from the answers so far: picking "cooking" on the
 * third page adds the cooking follow-ups after it. Form state is plain
 * `useState`; the whole thing is one component because the pages share it.
 */
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { FollowUpAnswer } from '@/components/FollowUpAnswer';
import { Interests } from '@/components/Interests';
import { Line } from '@/components/Line';
import { Page } from '@/components/Page';
import { Small } from '@/components/Small';
import { Typewriter } from '@/components/Typewriter';
import { Word } from '@/components/Word';
import { Margin, Spacing, Type } from '@/constants/theme';
import { api, describeError, FollowUp, Interest, InterestDetails, ProfileLocation } from '@/lib/api';
import { detectLocation } from '@/lib/location';
import { setProfileId } from '@/lib/profile-store';

/** How many follow-ups per interest the first run asks. The rest wait on their page. */
const FOLLOW_UPS_PER_INTEREST = 2;

type Step =
  | { kind: 'name' }
  | { kind: 'where' }
  | { kind: 'into' }
  | { kind: 'followUp'; interest: Interest; followUp: FollowUp }
  | { kind: 'lately' };

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState<ProfileLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [details, setDetails] = useState<InterestDetails>({});
  const [lately, setLately] = useState('');
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
      .then((list) => !cancelled && setOptions(list))
      .catch((err) => !cancelled && setLoadError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  // The pages, in order, given what has been answered so far.
  const steps = useMemo<Step[]>(() => {
    const followUps: Step[] = (options ?? [])
      .filter((i) => interests.includes(i.id))
      .flatMap((interest) => interest.followUps.slice(0, FOLLOW_UPS_PER_INTEREST).map((followUp) => ({ kind: 'followUp' as const, interest, followUp })));
    return [{ kind: 'name' }, { kind: 'where' }, { kind: 'into' }, ...followUps, { kind: 'lately' }];
  }, [options, interests]);

  const current = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const city = location?.city.trim();
      const profile = await api.createProfile({
        name: name.trim(),
        interests,
        interestDetails: details,
        location: city ? { ...location, city } : null,
        currentFocus: lately.trim() || undefined,
      });
      await setProfileId(profile.id);
      router.replace('/'); // `replace`, so the back gesture does not return here
    } catch (err) {
      setSubmitError(describeError(err));
      setSubmitting(false);
    }
  };

  const turn = () => (isLast ? submit() : setStep((s) => s + 1));
  const back = step > 0 ? () => setStep((s) => s - 1) : undefined;

  const useMyLocation = async () => {
    setLocating(true);
    setLocationNote(null);
    const result = await detectLocation();
    if (result.status === 'ok') setLocation(result.location);
    else if (result.status === 'denied') setLocationNote('Location permission was turned down. Type the city instead.');
    else setLocationNote("Couldn't work out a city here. Type it in instead.");
    setLocating(false);
  };

  // The name is the one thing the journal cannot start without; every other page can be turned blank.
  const canTurn = current.kind !== 'name' || name.trim().length > 0;

  const topLine = (
    <View style={styles.topLine}>{back ? <Word label="back" tone="grey" size={Type.small} onPress={back} style={styles.topWord} /> : <View />}</View>
  );

  return (
    <Page onTurn={canTurn ? turn : undefined} turnLabel={isLast ? (submitting ? 'Starting' : 'Start') : 'Turn the page'} onTurnBack={back}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {topLine}

        {current.kind === 'name' && (
          <View style={styles.middle}>
            <Typewriter text="What do you call them?" size={Type.heading} answered={name.trim().length > 0} />
            <Line value={name} onChangeText={setName} placeholder="Sam" autoCapitalize="words" autoCorrect={false} maxLength={60} size={24} style={styles.afterQuestion} accessibilityLabel="Their name" />
          </View>
        )}

        {current.kind === 'where' && (
          <View style={styles.middle}>
            <Typewriter text="Where do they live?" size={Type.heading} answered={!!location?.city} />
            <Line
              value={location?.city ?? ''}
              // Typing replaces any detected region/country: they cannot be trusted for a new city.
              onChangeText={(city) => setLocation(city ? { city } : null)}
              placeholder="Minneapolis"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={80}
              size={24}
              style={styles.afterQuestion}
              accessibilityLabel="Where they live"
            />
            <Word label={locating ? 'finding you' : 'use my location'} tone="grey" onPress={useMyLocation} disabled={locating} style={styles.afterLine} />
            {location?.region ? <Small>{[location.region, location.country].filter(Boolean).join(', ')}</Small> : null}
            {locationNote && <Small>{locationNote}</Small>}
            <Small style={styles.hint}>Only the city name is kept. It unlocks questions about around town.</Small>
          </View>
        )}

        {current.kind === 'into' && (
          <View style={styles.flex}>
            <Typewriter text="What are they into?" size={Type.heading} answered={interests.length > 0} style={styles.listHeading} />
            {options ? (
              <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Interests interests={options} selected={interests} onChange={setInterests} />
              </ScrollView>
            ) : (
              <Small>{loadError ?? ' '}</Small>
            )}
          </View>
        )}

        {current.kind === 'followUp' && (
          <View style={styles.flex}>
            <Small style={styles.listHeading}>{current.interest.label.toLowerCase()}</Small>
            <Typewriter
              text={current.followUp.prompt}
              size={Type.heading}
              answered={hasAnswer(details[current.interest.id]?.[current.followUp.id])}
              style={styles.listHeading}
            />
            <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <FollowUpAnswer
                followUp={current.followUp}
                value={details[current.interest.id]?.[current.followUp.id]}
                onChange={(v) => setDetails((d) => ({ ...d, [current.interest.id]: { ...d[current.interest.id], [current.followUp.id]: v } }))}
              />
            </ScrollView>
          </View>
        )}

        {current.kind === 'lately' && (
          <View style={styles.middle}>
            <Typewriter text="What's going on in their world lately?" size={Type.heading} answered={lately.trim().length > 0} />
            <Line value={lately} onChangeText={setLately} placeholder="a big week at work, training for a 10k" multiline maxLength={500} style={[styles.afterQuestion, styles.multiline]} accessibilityLabel="What is going on in their world lately" />
            {submitError && <Small style={styles.afterLine}>{submitError}</Small>}
            <Small style={styles.hint}>{submitting ? 'Starting the journal.' : 'Turn the page to start.'}</Small>
          </View>
        )}
      </KeyboardAvoidingView>
    </Page>
  );
}

function hasAnswer(value: string | string[] | undefined): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value && value.trim().length > 0;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topLine: { minHeight: 24, flexDirection: 'row' },
  topWord: { minHeight: 24 },
  middle: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Margin.bottom,
  },
  afterQuestion: { marginTop: Spacing.xl },
  afterLine: { marginTop: Spacing.sm, alignSelf: 'flex-start' },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  hint: { marginTop: Spacing.lg },
  listHeading: { marginTop: Spacing.md, marginBottom: Spacing.xs },
  listContent: { paddingTop: Spacing.md, paddingBottom: Margin.bottom },
});
