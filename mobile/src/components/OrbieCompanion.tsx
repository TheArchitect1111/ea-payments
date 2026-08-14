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
        <View style={styles.orbitOne} />
        <View style={styles.orbitTwo} />
        <View style={styles.orbShell}>
          <View style={styles.orbHighlight} />
          <View style={styles.orbCore} />
          <View style={styles.energyMark} />
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
  halo: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(69, 181, 255, 0.28)' },
  orbShell: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#113B91', borderWidth: 1.5, borderColor: '#81E6FF', shadowColor: '#2F8FFF', shadowOpacity: 0.55, shadowRadius: 13, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  orbHighlight: { position: 'absolute', left: 9, top: 7, width: 22, height: 14, borderRadius: 11, backgroundColor: 'rgba(195, 247, 255, 0.75)', transform: [{ rotate: '-24deg' }] },
  orbCore: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(29, 83, 190, 0.72)', borderWidth: 1, borderColor: 'rgba(135, 104, 255, 0.75)' },
  energyMark: { position: 'absolute', width: 12, height: 29, borderRadius: 8, borderLeftWidth: 2, borderRightWidth: 2, borderLeftColor: '#C7F7FF', borderRightColor: '#FFD578', transform: [{ rotate: '22deg' }] },
  orbitOne: { position: 'absolute', zIndex: 2, width: 74, height: 25, borderRadius: 18, borderWidth: 1.4, borderColor: '#FFD36B', transform: [{ rotate: '-14deg' }] },
  orbitTwo: { position: 'absolute', zIndex: 2, width: 68, height: 25, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255, 211, 107, 0.7)', transform: [{ rotate: '55deg' }] },
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
