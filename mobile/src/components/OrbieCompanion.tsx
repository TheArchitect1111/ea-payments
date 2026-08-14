import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { colors } from '../theme';

const ACTIONS = [
  { label: 'Capture anything', detail: 'Save a link, photo, or idea', icon: 'add' as const, route: '/(app)/capture' as const },
  { label: 'Ask Simplifi', detail: 'Get one clear answer', icon: 'sparkles' as const, route: '/(app)/workspace' as const },
  { label: 'Add note', detail: 'Remember it for later', icon: 'create-outline' as const, route: '/(app)/capture' as const },
  { label: 'Quick actions', detail: 'Review what needs attention', icon: 'flash-outline' as const, route: '/(app)/workspace' as const },
];

export function OrbieCompanion() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [breathe] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const openMenu = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true);
  };

  return (
    <>
      <Pressable
        style={styles.floatingButton}
        accessibilityRole="button"
        accessibilityLabel="Orbie, Simplifi assistant"
        onPress={openMenu}
        onLongPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setOpen(true);
        }}
      >
        <Animated.View style={[styles.halo, {
          opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] }),
          transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
        }]} />
        <View style={styles.orbShell}>
          <View style={styles.orbHighlight} />
          <View style={styles.orbCore} />
          <View style={styles.plasmaCore} />
          <View style={[styles.filament, styles.filamentOne]} />
          <View style={[styles.filament, styles.filamentTwo]} />
          <View style={[styles.filament, styles.filamentThree]} />
          <View style={[styles.filament, styles.filamentFour]} />
          <View style={[styles.filament, styles.filamentFive]} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
            <View style={styles.panelHandle} />
            <Text style={styles.eyebrow}>ORBiE · YOUR QUIET ADVANTAGE</Text>
            <Text style={styles.title}>What would you like to do?</Text>
            <Text style={styles.subtitle}>One clear action. No hunting through menus.</Text>
            <View style={styles.actionGrid}>
              {ACTIONS.map((action) => (
                <Pressable
                  key={action.label}
                  style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setOpen(false);
                    router.push(action.route);
                  }}
                >
                  <View style={styles.actionIcon}><Ionicons name={action.icon} size={17} color={colors.white} /></View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionDetail}>{action.detail}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: { position: 'absolute', zIndex: 50, right: 16, bottom: 78, width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(89, 80, 255, 0.3)' },
  orbShell: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09062A', borderWidth: 1.5, borderColor: '#81F1FF', shadowColor: '#6256FF', shadowOpacity: 0.8, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, elevation: 14 },
  orbHighlight: { position: 'absolute', left: 9, top: 7, width: 22, height: 14, borderRadius: 11, backgroundColor: 'rgba(195, 247, 255, 0.75)', transform: [{ rotate: '-24deg' }] },
  orbCore: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(61, 36, 150, 0.72)', borderWidth: 1, borderColor: 'rgba(119, 232, 255, 0.62)' },
  plasmaCore: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#F9FFFF', shadowColor: '#71EFFF', shadowOpacity: 1, shadowRadius: 12, elevation: 8 },
  filament: { position: 'absolute', width: 42, height: 2, borderRadius: 2, backgroundColor: '#BDF7FF', shadowColor: '#7B5CFF', shadowOpacity: 0.95, shadowRadius: 5, elevation: 4 },
  filamentOne: { transform: [{ rotate: '8deg' }] },
  filamentTwo: { transform: [{ rotate: '43deg' }] },
  filamentThree: { transform: [{ rotate: '82deg' }] },
  filamentFour: { transform: [{ rotate: '128deg' }] },
  filamentFive: { transform: [{ rotate: '161deg' }] },
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8, 18, 48, 0.28)' },
  panel: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#F8FAFF', shadowColor: '#081230', shadowOpacity: 0.24, shadowRadius: 24, shadowOffset: { width: 0, height: -8 } },
  panelHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#CDD6E8', marginBottom: 18 },
  eyebrow: { color: '#5B5CE2', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { marginTop: 7, color: '#0F1D3A', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { marginTop: 6, color: '#66738A', fontSize: 14, lineHeight: 20 },
  actionGrid: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '48.5%', minHeight: 122, padding: 14, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: '#E0E8F6', shadowColor: '#254A92', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  actionCardPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  actionIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3F63D8', marginBottom: 12 },
  actionLabel: { color: '#14233F', fontSize: 14, fontWeight: '800' },
  actionDetail: { marginTop: 4, color: '#748096', fontSize: 11, lineHeight: 16 },
  closeButton: { marginTop: 16, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#EAF0FB' },
  closeText: { color: colors.navy, fontWeight: '800', fontSize: 14 },
});
