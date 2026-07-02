import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

function ExpoGoFallback() {
  return (
    <Text style={styles.unavailable}>
      Voice dictation needs a dev build, not Expo Go. Type notes manually for now.
    </Text>
  );
}

export function VoiceNotesInput(props: Props) {
  const isExpoGo = Constants.appOwnership === 'expo';
  const [Impl, setImpl] = useState<typeof import('./VoiceNotesInputImpl').VoiceNotesInputImpl | null>(
    null,
  );

  useEffect(() => {
    if (isExpoGo) return;
    void import('./VoiceNotesInputImpl').then((mod) => setImpl(() => mod.VoiceNotesInputImpl));
  }, [isExpoGo]);

  if (isExpoGo) {
    return <ExpoGoFallback />;
  }

  if (!Impl) {
    return null;
  }

  return <Impl {...props} />;
}

const styles = StyleSheet.create({
  unavailable: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 14 },
});
