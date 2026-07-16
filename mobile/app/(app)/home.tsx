import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';
import { fetchBrief } from '../../src/api/client';
import { InstantFeelPressable } from '../../src/components/InstantFeelPressable';
import { SkeletonBlock } from '../../src/components/SkeletonBlock';
import {
  avatarColor,
  buildBriefHomeSummaries,
  formatBriefDate,
  initialsFromTitle,
  opportunityStatusLine,
  toneColor,
  type ActionCenterLike,
  type BriefHomeSummaryTone,
  type BriefItemLike,
  type BriefObjectLike,
} from '../../src/brief-home';
import { colors } from '../../src/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function summaryIconName(tone: BriefHomeSummaryTone): IoniconName {
  switch (tone) {
    case 'attention':
      return 'star';
    case 'proposal':
      return 'document-text';
    case 'followup':
      return 'time';
    case 'reading':
      return 'book';
  }
}

export default function HomeScreen() {
  const { token, me, refreshMe } = useAuth();
  const [brief, setBrief] = useState<Record<string, unknown> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const heroMotion = useRef(new Animated.Value(0)).current;
  const briefMotion = useRef(new Animated.Value(0)).current;
  const recentMotion = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    const data = await fetchBrief(token);
    if (data.ok) setBrief(data as Record<string, unknown>);
    else setError(data.error ?? 'Could not load Brief.');
    await refreshMe();
    setLoading(false);
  }, [token, refreshMe]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;
      if (reduceMotion) {
        heroMotion.setValue(1);
        briefMotion.setValue(1);
        recentMotion.setValue(1);
        return;
      }
      Animated.stagger(80, [
        Animated.timing(heroMotion, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(briefMotion, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(recentMotion, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => {
      active = false;
    };
  }, [briefMotion, heroMotion, recentMotion]);

  const briefData = (brief?.brief as Record<string, unknown> | undefined) ?? {};
  const items = (briefData.items as BriefItemLike[] | undefined) ?? [];
  const actionCenter = (brief?.actionCenter as ActionCenterLike | undefined) ?? {};
  const recentObjects = (brief?.recentObjects as BriefObjectLike[] | undefined) ?? [];
  const greeting = String(briefData.greeting ?? 'Good morning').replace(/\.$/, '');
  const todayLabel = useMemo(() => formatBriefDate(), []);
  const notifications = (me?.notifications as { unreadCount?: number } | undefined) ?? {};
  const unreadCount = Math.max(0, Number(notifications.unreadCount ?? 0));

  const enterStyle = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  });

  const summaries = useMemo(
    () =>
      buildBriefHomeSummaries({
        objects: recentObjects,
        actionCenter,
        briefItems: items,
      }),
    [recentObjects, actionCenter, items],
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.gold} />}
    >
      <Animated.View style={[styles.hero, enterStyle(heroMotion)]}>
        <View style={styles.heroGlow} pointerEvents="none" />
        <View style={styles.heroTop}>
          <Text style={styles.brand}>SIMPLIFI</Text>
          <InstantFeelPressable
            style={styles.notificationButton}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                : 'Notifications'
            }
            onPress={() => router.push('/(app)/settings')}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.navy} />
            {unreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </InstantFeelPressable>
        </View>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.date}>{todayLabel}</Text>
        <Text style={styles.attention}>What deserves your attention?</Text>
      </Animated.View>

      <Animated.View style={[styles.card, enterStyle(briefMotion)]}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{"TODAY'S BRIEF"}</Text>
          <InstantFeelPressable onPress={() => router.push('/(app)/workspace')}>
            <Text style={styles.viewAll}>View all</Text>
          </InstantFeelPressable>
        </View>

        {loading ? (
          <SkeletonBlock lines={4} style={styles.skeletonInline} />
        ) : error ? (
          <Text style={styles.muted}>{error}</Text>
        ) : summaries.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>Your Brief is clear</Text>
            <Text style={styles.muted}>Capture a URL, note, or file — Simplifi will surface what deserves attention.</Text>
            <InstantFeelPressable style={styles.captureBtn} onPress={() => router.push('/(app)/capture')}>
              <Text style={styles.captureText}>Quick capture</Text>
            </InstantFeelPressable>
          </View>
        ) : (
          summaries.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <View style={[styles.toneIcon, { backgroundColor: toneColor(item.tone) }]}>
                <Ionicons name={summaryIconName(item.tone)} size={15} color={colors.white} />
              </View>
              <View style={styles.summaryCopy}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.detail ? <Text style={styles.rowDetail}>{item.detail}</Text> : null}
              </View>
            </View>
          ))
        )}
      </Animated.View>

      <Animated.View style={[styles.card, enterStyle(recentMotion)]}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>RECENT OPPORTUNITIES</Text>
          <InstantFeelPressable onPress={() => router.push('/(app)/workspace')}>
            <Text style={styles.viewAll}>View all</Text>
          </InstantFeelPressable>
        </View>

        {loading ? (
          <SkeletonBlock lines={3} style={styles.skeletonInline} />
        ) : recentObjects.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>Nothing captured yet</Text>
            <Text style={styles.muted}>Paste a URL or upload a file to build your opportunity list.</Text>
            <InstantFeelPressable style={styles.captureBtn} onPress={() => router.push('/(app)/capture')}>
              <Text style={styles.captureText}>Quick capture</Text>
            </InstantFeelPressable>
          </View>
        ) : (
          recentObjects.map((obj) => (
            <InstantFeelPressable
              key={obj.id}
              style={styles.recentRow}
              onPress={() => router.push('/(app)/workspace')}
            >
              <View style={[styles.avatar, { backgroundColor: avatarColor(obj.title) }]}>
                <Text style={styles.avatarText}>{initialsFromTitle(obj.title)}</Text>
              </View>
              <View style={styles.recentCopy}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {obj.title}
                </Text>
                <Text style={styles.rowDetail} numberOfLines={1}>
                  {opportunityStatusLine(obj)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </InstantFeelPressable>
          ))
        )}
      </Animated.View>

      <InstantFeelPressable style={styles.refreshBtn} onPress={() => void onRefresh()}>
        <Text style={styles.refreshText}>Refresh brief</Text>
      </InstantFeelPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingBottom: 40 },
  hero: {
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    backgroundColor: '#D9E4F4',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(201, 168, 68, 0.28)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  brand: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3.2,
  },
  notificationButton: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(27, 43, 77, 0.10)',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  notificationBadgeText: {
    color: colors.navy,
    fontSize: 8,
    fontWeight: '900',
  },
  greeting: {
    color: '#0F1A2E',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  date: {
    marginTop: 8,
    color: '#5A6578',
    fontSize: 14,
  },
  attention: {
    marginTop: 12,
    color: '#3D4A5F',
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.navy,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    color: colors.navy,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.2,
  },
  viewAll: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 13,
  },
  muted: { color: colors.muted, lineHeight: 20, fontSize: 13 },
  emptyBlock: { paddingBottom: 12, gap: 8 },
  emptyTitle: { color: colors.navy, fontWeight: '800', fontSize: 15 },
  captureBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: colors.navy,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  captureText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },
  toneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.navy, fontWeight: '700', fontSize: 15 },
  rowDetail: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  recentCopy: { flex: 1, gap: 4 },
  refreshBtn: { alignSelf: 'center', marginTop: 20, marginBottom: 12, paddingVertical: 8, paddingHorizontal: 16 },
  refreshText: { color: colors.navy, fontWeight: '700' },
  skeletonInline: { margin: 0, borderWidth: 0, padding: 0, marginBottom: 12 },
});
