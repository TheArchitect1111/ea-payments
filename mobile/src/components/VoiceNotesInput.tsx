import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { colors } from '../theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

function speechAvailable(): boolean {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

export function VoiceNotesInput({ value, onChange }: Props) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState('');

  useEffect(() => {
    setAvailable(speechAvailable());
  }, []);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript?.trim();
    if (!text || !event.isFinal) return;
    const prefix = value.trim() ? `${value.trim()} ` : '';
    onChange(`${prefix}${text}`);
    setHint('Added voice transcript to notes.');
  });
  useSpeechRecognitionEvent('error', (event) => {
    setHint(event.message ?? 'Voice recognition error.');
    setListening(false);
  });

  const toggleListening = async () => {
    setHint('');
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        setHint('Microphone and speech permissions are required.');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
      setHint('Listening… tap again to stop.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Voice unavailable.';
      setHint(
        message.includes('native module')
          ? 'Voice notes need a dev build (`npx expo run:ios` or `run:android`), not Expo Go.'
          : message,
      );
    }
  };

  if (available === false) {
    return (
      <Text style={styles.unavailable}>
        Voice dictation requires a dev client build. Type notes manually or run `npx expo run:ios`.
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.btn, listening && styles.btnActive]}
        onPress={() => void toggleListening()}
      >
        <Text style={listening ? styles.btnTextActive : styles.btnText}>
          {listening ? 'Stop dictation' : 'Dictate notes'}
        </Text>
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  btn: {
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  btnText: { color: colors.navy, fontWeight: '800', fontSize: 14 },
  btnTextActive: { color: colors.white, fontWeight: '800', fontSize: 14 },
  hint: { color: colors.muted, marginTop: 8, fontSize: 13, lineHeight: 18 },
  unavailable: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 14 },
});
